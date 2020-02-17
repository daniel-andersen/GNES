import Tokenizer from '../interpreter/tokenizer'
import * as Node from './nodes'
import Util from '../util/util'
import { Variable, Constant } from '../model/variable'
import { Scope } from '../model/scope'
import { Error } from '../model/error'

export class SourceTree {
    constructor(language, nativeClasses, builtinFiles) {
        this.language = language
        this.nativeClasses = nativeClasses
        this.builtinFiles = builtinFiles

        this.tokenizer = new Tokenizer(language)
        this.programNode = undefined
    }

    async build(files=[], texts=[]) {
        this.programNode = await this.compile(files, texts)
        return this.programNode
    }

    async compile(files=[], textDicts=[]) {

        // All files
        const allFiles = []
            .concat(this.builtinFiles)
            .concat(files)

        // Create global scope - will be populated with classes through building of source tree
        const globalScope = new Scope(undefined, Scope.Type.Global)

        // Create source tree
        const fileNodes = []

        for (let filename of allFiles) {
            const fileNode = await this.buildFromFile(filename, globalScope)
            if (fileNode instanceof Error) {
                return fileNode
            }
            fileNodes.push(fileNode)
        }

        for (let textDict of textDicts) {
            const fileNode = await this.buildFromText(textDict.text, textDict.filename, globalScope)
            if (fileNode instanceof Error) {
                return fileNode
            }
            fileNodes.push(fileNode)
        }

        // Create global node
        const programNode = new Node.ProgramNode(fileNodes, globalScope)

        // Postprocess source tree
        this.postProcess(programNode)

        return programNode
    }

    postProcess(programNode) {

        // Register classes, functions, etc.
        for (let fileNode of programNode.fileNodes) {
            for (let node of fileNode.nodes) {
                if (node instanceof Node.ClassNode) {
                    this.registerClass(node, programNode.scope, fileNode.scope)
                }
                else if (node instanceof Node.SharedFunctionDefinitionNode) {
                    throw {error: 'Shared Functions can only be defined in a class', node: node}
                }
                else if (node instanceof Node.FunctionDefinitionNode) {
                    this.registerFunction(node, fileNode.scope)
                }
                else if (node instanceof Node.UpdateFunctionDefinitionNode || node instanceof Node.SharedUpdateFunctionDefinitionNode) {
                    throw {error: 'Update functions can only be defined in a class', node: node}
                }
            }
        }

        // Register extending classes
        for (let className of Object.keys(programNode.scope.classes)) {
            const classNode = programNode.scope.resolveClass(className)
            if (classNode.ofTypeName !== undefined) {
                this.registerExtendingClass(classNode, programNode.scope)
            }
        }

        // Register extending behaviours
        for (let behaviourName of Object.keys(programNode.scope.behaviourDefinitions)) {
            const behaviourNode = programNode.scope.resolveBehaviourDefinition(behaviourName)
            if (behaviourNode.ofTypeName !== undefined) {
                this.registerExtendingBehaviour(behaviourNode, programNode.scope)
            }
        }
        // Reset misc

        programNode.scope.onUpdateCallbacks = []
    }

    async buildFromFile(filename, globalScope) {

        // Read lines from file
        const text = await Util.readTextFile(filename)

        // Build from text
        return this.buildFromText(text, filename, globalScope)
    }

    async buildFromText(text, filename, globalScope) {

        // Split into array
        const lines = text.split('\n')

        // Tokenize lines
        const tokens = this.tokenizer.tokenizeLines(lines, filename)

        // Parse file
        return this.parseTokens(tokens, globalScope)
    }

    parseTokens(tokens, globalScope) {
        tokens = this.duplicateTokens(tokens)

        const fileScope = new Scope(globalScope, Scope.Type.File)
        const fileNode = new Node.FileNode(tokens, [], fileScope)

        // Parse nodes
        while (tokens.length > 0) {
            const node = this.parse(tokens)
            if (node === undefined) {
                return fileNode
            }
            if (node instanceof Error) {
                return node
            }

            // Add node if not newline
            if (!(node instanceof Node.NewlineNode)) {
                fileNode.nodes.push(node)
            }
            fileNode.tokens = fileNode.tokens.concat(node.tokens)

            // Remove tokens
            tokens.splice(0, node.tokens.length)
        }

        return fileNode
    }

    parseBlock(tokens, end=undefined) {
        tokens = this.duplicateTokens(tokens)

        const blockNode = new Node.BlockNode()

        // Parse nodes
        while (tokens.length > 0) {

            // Check end token
            if (end !== undefined && end.indexOf(tokens[0].token) > -1) {
                return blockNode
            }

            // Parse nodes
            const node = this.parse(tokens)
            if (node === undefined) {
                return blockNode
            }
            if (node instanceof Error) {
                return node
            }

            // Add node if not newline
            if (!(node instanceof Node.NewlineNode)) {
                blockNode.nodes.push(node)
            }
            blockNode.tokens = blockNode.tokens.concat(node.tokens)

            // Remove tokens
            tokens.splice(0, node.tokens.length)
        }

        return blockNode
    }

    parse(tokens) {
        tokens = this.duplicateTokens(tokens)

        // No tokens left
        if (tokens.length == 0 || tokens[0].type == this.language.tokenType.EOF) {
            return undefined
        }

        // Newline
        if (tokens[0].type == this.language.tokenType.EOL) {
            return new Node.NewlineNode([tokens[0]])
        }

        // Parse statement
        const statementResult = this.parseStatement(tokens)
        if (!(statementResult instanceof Error)) {
            return statementResult
        }

        // Parse expression
        const expressionResult = this.parseExpression(tokens)
        if (!(expressionResult instanceof Error)) {
            return expressionResult
        }

        // Re-throw error
        if (statementResult.firstToken.tokenIndex >= expressionResult.firstToken.tokenIndex) {
            return statementResult
        }
        else {
            return expressionResult
        }
    }

    parseStatement(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Match all statements
        let bestError = undefined
        let bestTokenIndex = tokens[0].tokenIndex

        for (let statement of this.language.statements) {
            const result = this.matchStatement(statement, tokens)
            if (result instanceof Error) {
                if (result.firstToken !== undefined && result.firstToken.tokenIndex > bestTokenIndex) {
                    bestError = result
                    bestTokenIndex = result.firstToken.tokenIndex
                }
            }
            else {
                return statement.node(result.matchedTokens, result.matchedNodes, this)
            }
        }

        return bestError || new Error('Unexpected symbol "' + tokens[0].token + '".', tokens[0])
    }

    parseExpression(tokens, endTokens=[]) {
        tokens = this.duplicateTokens(tokens)

        // Find end of expression (= any statement token)
        const expressionTokens = []
        let parenthesisCount = 0

        while (tokens.length > 0) {

            // Account for parenthesis
            if (this.isParenthesisStart(tokens[0])) {
                parenthesisCount += 1
            }
            if (this.isParenthesisEnd(tokens[0])) {
                parenthesisCount -= 1
                if (parenthesisCount < 0) {
                    break
                }
            }

            // Check if end reached
            let endReached = false
            endReached |= tokens[0].type == this.language.tokenType.EOL
            endReached |= tokens[0].type == this.language.tokenType.EOF
            endReached |= endTokens.includes(tokens[0].token)
            endReached &= parenthesisCount == 0

            if (endReached) {
                break
            }

            // Add token to expression
            expressionTokens.push(tokens[0])
            tokens.splice(0, 1)
        }

        if (expressionTokens.length <= 0) {
            return new Error('Expression expected', tokens[0])
        }

        // Build arithmetic tree
        if (expressionTokens.length > 1) {
            const arithmeticNode = this.parseArithmeticNode(expressionTokens)
            if (!(arithmeticNode instanceof Error)) {
                return arithmeticNode
            }
        }

        // Match all expressions
        let error = undefined
        for (let expression of this.language.expressions) {
            const statementResult = this.matchStatement(expression, expressionTokens)
            if (statementResult instanceof Error) {
                error = statementResult
            }
            else {
                return expression.node(statementResult.matchedTokens, statementResult.matchedNodes, this)
            }
        }

        // Grouped expression
        if (this.isParenthesisStart(expressionTokens[0])) {
            return this.parseExpression(this.findGroupedExpressionTokens(expressionTokens).groupTokens)
        }

        // Constant
        if (expressionTokens.length == 1) {
            return new Node.ConstantNode(expressionTokens, new Constant(expressionTokens[0].token))
        }

        return error
    }

    parseCommaSeperatedTokens(tokens) {
        tokens = this.duplicateTokens(tokens)
        if (tokens.length == 0) {
            return new Error('No tokens')
        }

        // Check starting with parenthesis
        const startParenthesis = this.isParenthesisStart(tokens[0])

        // Find parenthesis group
        let innerTokens = []
        let listTokens = []

        if (startParenthesis) {
            const groupedExpressionTokens = this.findGroupedExpressionTokens(tokens)
            if (groupedExpressionTokens instanceof Error) {
                return new Error('Missing end parenthesis', tokens[0])
            }
            innerTokens = groupedExpressionTokens.groupTokens
            listTokens = groupedExpressionTokens.allTokens
        }

        // Use newline as delimiter
        else {
            for (let token of tokens) {
                if (token.type == this.language.tokenType.EOL) {
                    break
                }
                innerTokens.push(token)
            }
            listTokens = this.duplicateTokens(innerTokens)
        }

        // Parse tokens
        let listNodes = []
        let currentTokens = []
        let parenthesisCount = 0

        for (let i = 0; i < innerTokens.length; i++) {
            const token = innerTokens[i]

            // Account for parenthesis
            if (this.isParenthesisStart(token)) {
                parenthesisCount += 1
            }
            if (this.isParenthesisEnd(token)) {
                parenthesisCount -= 1
                if (parenthesisCount < 0) {
                    break
                }
            }
            if (parenthesisCount > 0) {
                currentTokens.push(token)
                continue
            }

            // Add token if not comma
            if (token.type != this.language.tokenType.Comma) {
                currentTokens.push(token)
            }

            // Split assignments by comma
            if ((token.type == this.language.tokenType.Comma && parenthesisCount == 0) || i === innerTokens.length - 1) {

                // Parse expression
                const node = this.parseExpression(currentTokens)
                if (node instanceof Error) {
                    return node
                }

                // Add expression
                listNodes.push(node)

                // Reset tokens
                currentTokens = []
            }
        }

        return {tokens: listTokens, nodes: listNodes}
    }

    parseArithmeticNode(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Find arithmetic token of most significance
        let parenthesisCount = 0
        let arithmeticToken = undefined
        let arithmeticTokenPosition = undefined

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            // Handle parenthesis groups
            if (this.isParenthesisStart(token)) {
                parenthesisCount += 1
                continue
            }
            if (this.isParenthesisEnd(token)) {
                parenthesisCount -= 1
                continue
            }
            if (parenthesisCount < 0) {
                return new Error('Unexpected end parenthesis.', tokens[0])
            }

            // Skip tokens inside parenthesis group
            if (parenthesisCount > 0) {
                continue
            }

            // Determine arithmetic operation priority
            if (this.language.arithmeticTokens.includes(token.type) && (arithmeticToken === undefined || this.language.arithmeticOperationPriority[token.type] < this.language.arithmeticOperationPriority[arithmeticToken.type])) {
                arithmeticToken = token
                arithmeticTokenPosition = i
            }
        }

        if (arithmeticToken === undefined) {
            return new Error('Expected arithmetic operation', tokens[0])
        }

        // Build subtrees
        let leftSideExpressionNode = arithmeticTokenPosition > 0 ? this.parseExpression(tokens.slice(0, arithmeticTokenPosition)) : undefined
        const rightSideExpressionNode = this.parseExpression(tokens.slice(arithmeticTokenPosition + 1))

        // Left side class, special case - TODO! Hacked!
        if (leftSideExpressionNode instanceof Error && leftSideExpressionNode.token.type == this.language.tokenType.Name) {
            leftSideExpressionNode = new Node.ConstantNode(leftSideExpressionNode.tokens, new Constant(leftSideExpressionNode.token.token))
        }

        // Check errors
        if (leftSideExpressionNode !== undefined && leftSideExpressionNode instanceof Error) {
            return leftSideExpressionNode
        }
        if (rightSideExpressionNode === undefined || rightSideExpressionNode instanceof Error) {
            return rightSideExpressionNode
        }

        // Check if both sides are valid arithmetic expressions
        if (leftSideExpressionNode !== undefined && !leftSideExpressionNode.validArithmeticExpression) {
            return new Error('Expected arithmetic expression', leftSideExpressionNode.tokens[0], leftSideExpressionNode)
        }
        if (!rightSideExpressionNode.validArithmeticExpression) {
            return new Error('Expected arithmetic expression', rightSideExpressionNode.tokens[0], rightSideExpressionNode)
        }

        // Return arithmetic expression
        return new Node.ArithmeticNode(tokens, leftSideExpressionNode, arithmeticToken, rightSideExpressionNode)
    }

    findGroupedExpressionTokens(tokens) {
        let parenthesisCount = 0

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            if (this.isParenthesisStart(token)) {
                parenthesisCount += 1
            }
            if (this.isParenthesisEnd(token)) {
                parenthesisCount -= 1
            }
            if (parenthesisCount === 0) {
                return {groupTokens: tokens.slice(1, i), allTokens: tokens.slice(0, i + 1)}
            }
        }
        return new Error('Expected parenthesis', tokens[0])
    }

    matchStatement(statement, tokens) {
        const firstToken = tokens[0]
        tokens = this.duplicateTokens(tokens)

        let position = 0

        let matchedNodes = []
        let matchedTokens = []

        // Match statement
        while (position < statement.match.length) {

            // Check if any tokens left
            if (tokens.length <= 0) {
                return new Error('Expected statement', firstToken)
            }

            // Match entry
            const entry = statement.match[position]
            const node = this.matchEntry(entry, tokens)
            if (node instanceof Error) {
                return node
            }

            // Remove tokens
            tokens.splice(0, node.tokens.length)

            // Flatten group node
            if (node instanceof Node.GroupNode) {
                matchedNodes.push(...node.nodes)
            }

            // Add normal node
            else {

                // Set ID on node
                node.id = entry.id

                // Add node
                matchedNodes.push(node)
            }

            // Add matched tokens
            matchedTokens = matchedTokens.concat(node.tokens)

            // Advance match
            position += 1
        }

        return {matchedTokens, matchedNodes, statement}
    }

    matchEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        switch (entry['type']) {
            case 'token': {
                return this.matchTokenEntry(entry, tokens)
            }
            case 'name': {
                return this.matchNameEntry(entry, tokens)
            }
            case 'variable': {
                return this.matchVariableEntry(entry, tokens)
            }
            case 'expression': {
                return this.matchExpressionEntry(entry, tokens)
            }
            case 'statement': {
                const entry = this.matchStatementEntry(entry, tokens)
                if (entry !== undefined) {
                    return entry
                }
                return this.matchExpressionEntry(entry, tokens)
            }
            case 'parameterList': {
                return this.matchParameterListEntry(entry, tokens)
            }
            case 'parameterDefinitions': {
                return this.matchParameterDefinitionsEntry(entry, tokens)
            }
            case 'expressionList': {
                return this.matchExpressionListEntry(entry, tokens)
            }
            case 'group': {
                return this.matchGroupEntry(entry, tokens)
            }
            case 'subtree': {
                return this.matchSubtreeEntry(entry, tokens)
            }
            default: {
                return new Error('Unexpected symbol "' + tokens[0].token + '"', tokens[0])
            }
        }
    }

    matchTokenEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)
        if ('token' in entry) {
            if (tokens[0].token == entry['token']) {
                return new Node.TokenNode([tokens[0]], tokens[0])
            } else {
                return new Error('Unexpected symbol "' + tokens[0].token + '". Expected "' + entry.token + '"', tokens[0])
            }
        }
        if ('code' in entry) {
            if (tokens[0].type == entry['code']) {
                return new Node.TokenNode([tokens[0]], tokens[0])
            } else {
                return new Error('Unexpected symbol "' + tokens[0].token + '"', tokens[0])
            }
        }
        return new Error('Unexpected symbol "' + tokens[0].token + '"', tokens[0])
    }

    matchNameEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        if (tokens[0].type != this.language.tokenType.Name) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Expected keyword or class name.', tokens[0])
        }
        return new Node.ConstantNode([tokens[0]], new Constant(tokens[0].token))
    }

    matchVariableEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        if (tokens[0].type != this.language.tokenType.Variable) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Expected variable.', tokens[0])
        }
        if (this.language.arithmeticTokens.includes(tokens[0].type)) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Expected variable, but got arithmetic symbol.', tokens[0])
        }
        if (tokens[0].token.charAt(0) != tokens[0].token.charAt(0).toLowerCase()) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Variables must start with lower case character.', tokens[0])
        }
        return new Node.ConstantNode([tokens[0]], new Constant(tokens[0].token))
    }

    matchExpressionEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const expressionNode = this.parseExpression(tokens, entry.endTokens)
        if (expressionNode instanceof Node.ExpressionNode) {
            return expressionNode
        }
        return new Error('Expected expression', expressionNode)
    }

    matchStatementEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const statementNode = this.parseStatement(tokens)
        if (statementNode instanceof Node.StatementNode) {
            return statementNode
        }
        return new Error('Expected statement', statementNode)
    }

    matchParameterListEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const result = this.parseCommaSeperatedTokens(tokens)
        if (result instanceof Error) {
            return result
        }
        return new Node.ParameterListNode(result.tokens, result.nodes)
    }

    matchParameterDefinitionsEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const result = this.parseCommaSeperatedTokens(tokens)
        if (result instanceof Error) {
            return result
        }
        return new Node.ParameterDefinitionsNode(result.tokens, result.nodes)
    }

    matchExpressionListEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        if (tokens.length === 0 || tokens[0].token === undefined || tokens[0].token != '[') {
            return new Error('Expected [', tokens.length > 0 ? tokens[0].token : undefined)
        }
        const result = this.parseCommaSeperatedTokens(tokens)
        if (result instanceof Error) {
            return result
        }
        return new Node.ExpressionListNode(result.tokens, result.nodes)
    }

    matchGroupEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        let matchError = undefined

        const statementResult = this.matchStatement(entry['group'], tokens)
        if (!(statementResult instanceof Error)) {
            return statementResult.statement.node(statementResult.matchedTokens, statementResult.matchedNodes)
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new Node.GroupNode()
        }

        return statementResult || new Error('Expected statements', tokens[0])
    }

    matchSubtreeEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const blockNode = this.parseBlock(tokens, entry.endTokens)
        if (!(blockNode instanceof Error)) {
            return blockNode
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new Node.BlockNode()
        }

        return blockNode
    }

    getNodeWithId(nodes, id) {
        for (let node of nodes) {
            if (node.id == id) {
                return node
            }
        }
        return undefined
    }

    getConstantNameWithId(nodes, id) {
        for (let node of nodes) {
            if (node.id == id) {
                if (node instanceof Node.ConstantNode && node.constant.type == Constant.Type.Variable) {
                    return node.constant.value()
                } else {
                    return new Error('Expected variable', node)
                }
            }
        }
        return undefined
    }

    isParenthesisStart(token) {
        return token.token !== undefined && (token.token == '(' || token.token == '[' || token.token == '{')
    }

    isParenthesisEnd(token) {
        return token.token !== undefined && (token.token == ')' || token.token == ']' || token.token == '}')
    }

    duplicateTokens(tokens) {
        return tokens.slice(0)
    }

    registerClass(classNode, globalScope, fileScope) {
        if (classNode instanceof Node.BehaviourDefinitionNode) {
            if (globalScope.resolveBehaviourDefinition(classNode.className) !== undefined) {
                throw {error: 'Behaviour with name "' + classNode.className + '" already defined', node: classNode}
            }
            globalScope.setBehaviourDefinition(classNode)
        }
        else {
            if (globalScope.resolveClass(classNode.className) !== undefined) {
                throw {error: 'Class with name "' + classNode.className + '" already defined', node: classNode}
            }
            globalScope.setClass(classNode)
        }

        classNode.scope = new Scope(globalScope, Scope.Type.Class)
        classNode.sharedScope = new Scope(globalScope, Scope.Type.Class)
        classNode.propertyNodes = []
        classNode.sharedPropertyNodes = []
        classNode.behaviourNodes = []
        classNode.referencedBehaviourNodes = []

        // First pass
        for (let node of classNode.contentNode.nodes) {
            if (node instanceof Node.SharedPropertyNode) {
                this.registerSharedProperty(classNode, node)
            }
            else if (node instanceof Node.PropertyNode) {
                this.registerProperty(classNode, node)
            }
            else if (node instanceof Node.SharedConstructorNode) {
                this.registerConstructor(classNode, node, classNode.sharedScope)
            }
            else if (node instanceof Node.BehaviourNode) {
                this.registerBehaviour(classNode, node)
            }
            else if (node instanceof Node.ReferencedBehaviourNode) {
                this.registerReferencedBehaviour(classNode, node)
            }
            else if (node instanceof Node.IncompatibleBehaviourNode) {
                this.registerIncompatibleBehaviour(classNode, node)
            }
            else if (node instanceof Node.ConstructorNode) {
                this.registerConstructor(classNode, node, classNode.scope)
            }
            else if (node instanceof Node.SharedFunctionDefinitionNode) {
                this.registerSharedFunction(node, classNode, globalScope)
            }
            else if (node instanceof Node.FunctionDefinitionNode) {
                this.registerFunction(node, classNode.scope)
            }
        }
    }

    registerSharedProperty(classNode, propertyNode) {
        classNode.sharedPropertyNodes.push(propertyNode)
    }

    registerProperty(classNode, propertyNode) {
        classNode.propertyNodes.push(propertyNode)
    }

    registerSharedProperty(classNode, propertyNode) {
        classNode.sharedPropertyNodes.push(propertyNode)
    }

    registerBehaviour(classNode, behaviourNode) {
        if (classNode instanceof Node.BehaviourDefinitionNode) {
            throw {error: 'Behaviours can only be used in classes', node: behaviourNode}
        }
        classNode.behaviourNodes.push(behaviourNode)
    }

    registerReferencedBehaviour(classNode, behaviourNode) {
        if (!(classNode instanceof Node.BehaviourDefinitionNode)) {
            throw {error: 'Referenced behaviours can only be used in Behaviour classes', node: behaviourNode}
        }
        classNode.referencedBehaviourNodes.push(behaviourNode)
    }

    registerIncompatibleBehaviour(classNode, behaviourNode) {
        if (!(classNode instanceof Node.BehaviourDefinitionNode)) {
            throw {error: 'Incompatible behaviours can only be used in Behaviour classes', node: behaviourNode}
        }
        classNode.referencedBehaviourNodes.push(behaviourNode)
    }

    registerConstructor(classNode, constructorNode, scope) {
        if (scope.resolveFunction('_constructor') !== undefined) {
            throw {error: 'Constructor already defined in this class', node: node}
        }
        const functionNode = new Node.FunctionDefinitionNode(constructorNode.tokens, '_constructor', new Node.ParameterDefinitionsNode(constructorNode.tokens, []), constructorNode.contentNode)
        scope.setFunction(functionNode)
    }

    registerFunction(node, scope) {
        if (scope.resolveFunction(node.functionName) !== undefined) {
            throw {error: 'Function with name "' + node.functionName + '" already defined in this context', node: node}
        }
        scope.setFunction(node)
    }

    registerSharedFunction(node, classNode, globalScope) {
        if (classNode.sharedScope.resolveFunction(node.functionName) !== undefined) {
            throw {error: 'Function with name "' + node.functionName + '" already defined in this context', node: node}
        }
        classNode.sharedScope.setFunction(node)

        for (let order of Node.UpdateOrder.orders) {
            if (node.functionName == Node.UpdateOrder.updateFunctionName(order)) {
                globalScope.addUpdateClass(node, classNode)
            }
        }
    }

    registerExtendingClass(classNode, globalScope) {
        const extendedClassNode = globalScope.resolveClass(classNode.ofTypeName)
        if (extendedClassNode === undefined) {
            throw {error: 'Class of type "' + classNode.ofTypeName + '" not found', node: classNode}
        }

        classNode.scope.parentScope = extendedClassNode.scope
        classNode.parentClass = extendedClassNode
    }

    registerExtendingBehaviour(behaviourNode, globalScope) {
        const extendedBehaviourNode = globalScope.resolveBehaviourDefinition(behaviourNode.ofTypeName)
        if (extendedBehaviourNode === undefined) {
            throw {error: 'Behaviour of type "' + behaviourNode.ofTypeName + '" not found', node: behaviourNode}
        }

        behaviourNode.scope.parentScope = extendedBehaviourNode.scope
        behaviourNode.parentClass = extendedBehaviourNode
    }
}
