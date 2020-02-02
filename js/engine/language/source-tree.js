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

    async build(files) {

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

        // Create global node
        this.programNode = new Node.ProgramNode(fileNodes, globalScope)

        // Postprocess source tree
        this.postProcess(this.programNode)

        console.log("---------")
        console.log("Result:")
        console.log(this.programNode)
        console.log("---------")

        return undefined
    }

    postProcess(programNode) {

        // Register classes, functions, etc.
        for (let fileNode of programNode.fileNodes) {
            for (let node of fileNode.nodes) {
                if (node instanceof Node.ClassNode) {
                    this.registerClass(node, programNode.scope, fileNode.scope)
                }
                if (node instanceof Node.FunctionDefinitionNode) {
                    this.registerFunction(node, fileNode.scope)
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

        // Reset misc
        programNode.scope.onUpdateCallbacks = []
    }

    async buildFromFile(filename, globalScope) {

        // Read lines from file
        const text = await Util.readTextFile(filename)
        const lines = text.split('\n')

        // Tokenize lines
        const tokens = this.tokenizer.tokenizeLines(lines)

        // Parse file
        return this.parseFile(tokens, globalScope)
    }

    parseFile(tokens, globalScope) {
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

    parseExpression(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Find end of expression (= any statement token)
        const expressionTokens = []
        let parenthesisCount = 0

        while (tokens.length > 0) {

            // End of file
            if (tokens[0].type == this.language.tokenType.EOF) {
                break
            }

            // Account for parenthesis
            if (tokens[0].type == this.language.tokenType.ParenthesisStart) {
                parenthesisCount += 1
            }
            if (tokens[0].type == this.language.tokenType.ParenthesisEnd) {
                parenthesisCount -= 1
                if (parenthesisCount < 0) {
                    break
                }
            }

            // Check if expression token
            let expressionToken = false
            expressionToken |= parenthesisCount > 0
            expressionToken |= this.language.expressionTokens.includes(tokens[0].type)
            expressionToken |= expressionTokens.length > 0 && expressionTokens[expressionTokens.length - 1].type == this.language.tokenType.New && tokens[0].type == this.language.tokenType.Name
            expressionToken |= tokens.length >= 2 && tokens[0].type == this.language.tokenType.Name && tokens[1].type == this.language.tokenType.Dot
            if (!expressionToken) {
                break
            }

            // End of line
            if (parenthesisCount == 0 && tokens[0].type == this.language.tokenType.EOL) {
                break
            }

            // Add token to expression
            expressionTokens.push(tokens[0])
            tokens.splice(0, 1)
        }

        if (expressionTokens.length <= 0) {
            return new Error('Expression expected', tokens[0])
        }

        // Constant
        if (expressionTokens.length == 1) {
            return new Node.ConstantNode(expressionTokens, new Constant(expressionTokens[0].token))
        }

        // Build arithmetic tree
        const arithmeticNode = this.parseArithmeticNode(expressionTokens)
        if (!(arithmeticNode instanceof Error)) {
            return arithmeticNode
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
        if (expressionTokens[0].type == this.language.tokenType.ParenthesisStart) {
            return this.parseExpression(this.findGroupedExpressionTokens(expressionTokens).groupTokens)
        }

        return error
    }

    parseCommaSeperatedTokens(tokens) {
        tokens = this.duplicateTokens(tokens)
        if (tokens.length == 0) {
            return new Error('No tokens')
        }

        // Check starting with parenthesis
        const startParenthesis = tokens[0].type == this.language.tokenType.ParenthesisStart

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

        // Parse parameters
        let listNodes = []
        let currentTokens = []
        let parenthesisCount = 0

        for (let i = 0; i < innerTokens.length; i++) {
            const token = innerTokens[i]

            // Account for parenthesis
            if (token.type == this.language.tokenType.ParenthesisStart) {
                parenthesisCount += 1
            }
            if (token.type == this.language.tokenType.ParenthesisEnd) {
                parenthesisCount -= 1
                if (parenthesisCount < 0) {
                    break
                }
            }
            if (parenthesisCount > 0) {
                currentTokens.push(token)
                continue
            }

            // Add token to assignment
            if (token.type != this.language.tokenType.Comma) {
                currentTokens.push(token)
            }

            // Split assignments by comma
            if ((token.type == this.language.tokenType.Comma && parenthesisCount == 0) || i === innerTokens.length - 1) {

                let result = undefined

                // Add parameter assignment
                const parameterAssignmentNode = this.parseParameterAssignmentNode(currentTokens)
                if (!(parameterAssignmentNode instanceof Error)) {
                    listNodes.push(parameterAssignmentNode)
                    result = parameterAssignmentNode
                }

                // Add constant
                if (result === undefined && currentTokens.length == 1) {
                    const constantNode = new Node.ConstantNode(currentTokens, new Constant(currentTokens[0].token))
                    if (!(constantNode instanceof Error)) {
                        listNodes.push(constantNode)
                        result = constantNode
                    }
                }

                // Neither assignment, nor constant
                if (result === undefined) {
                    return new Error('Unexpected symbol "' + token.token + '". Expected assignment or constant.', token)
                }

                // Reset tokens
                currentTokens = []
            }
        }

        return {tokens: listTokens, nodes: listNodes}
    }

    parseParameterAssignmentNode(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Parse assignment node
        const assignmentNode = this.parseStatement(tokens)
        if (assignmentNode instanceof Error) {
            return assignmentNode
        }
        if (!(assignmentNode instanceof Node.AssignmentNode)) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Expected parameter assignment.', tokens[0], assignmentNode)
        }

        // Convert into parameter assignment node
        if (assignmentNode.variableExpressionNode !== undefined) {
            return new Error('Unexpected symbol "' + tokens[0].token + '". Expected parameter name.', tokens[0], assignmentNode)
        }
        return new Node.ParameterAssignmentNode(assignmentNode.tokens.slice(0), assignmentNode.variableName, assignmentNode.assignmentExpressionNode)
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
            if (token.type == this.language.tokenType.ParenthesisStart) {
                parenthesisCount += 1
                continue
            }
            if (token.type == this.language.tokenType.ParenthesisEnd) {
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
        let leftSideExpressionNode = this.parseExpression(tokens.slice(0, arithmeticTokenPosition))
        const rightSideExpressionNode = this.parseExpression(tokens.slice(arithmeticTokenPosition + 1))

        // Left side class, special case - TODO! Hacked!
        if (leftSideExpressionNode instanceof Error && leftSideExpressionNode.token.type == this.language.tokenType.Name) {
            leftSideExpressionNode = new Node.ConstantNode(leftSideExpressionNode.tokens, new Constant(leftSideExpressionNode.token.token))
        }
        return new Node.ArithmeticNode(tokens, leftSideExpressionNode, arithmeticToken, rightSideExpressionNode)
    }

    findGroupedExpressionTokens(tokens) {
        let parenthesisCount = 0

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            if (token.type == this.language.tokenType.ParenthesisStart) {
                parenthesisCount += 1
            }
            if (token.type == this.language.tokenType.ParenthesisEnd) {
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

        const expressionNode = this.parseExpression(tokens)
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

        const blockNode = this.parseBlock(tokens, entry.end)
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
                    return new Error("Expected variable", node)
                }
            }
        }
        return undefined
    }

    duplicateTokens(tokens) {
        return tokens.slice(0)
    }

    registerClass(classNode, globalScope, fileScope) {
        if (classNode instanceof Node.BehaviourDefinitionNode) {
            if (globalScope.resolveBehaviourDefinition(classNode.className) !== undefined) {
                return new Error('Behaviour with name "' + classNode.className + '" already defined', classNode)
            }
            globalScope.setBehaviourDefinition(classNode)
        }
        else {
            if (globalScope.resolveClass(classNode.className) !== undefined) {
                return new Error('Class with name "' + classNode.className + '" already defined', classNode)
            }
            globalScope.setClass(classNode)
        }

        classNode.scope = new Scope(globalScope, Scope.Type.Class)
        classNode.sharedScope = new Scope(globalScope, Scope.Type.Class)
        classNode.propertyNodes = []
        classNode.sharedPropertyNodes = []
        classNode.behaviourNodes = []

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
            else if (node instanceof Node.ConstructorNode) {
                this.registerConstructor(classNode, node, classNode.scope)
            }
            else if (node instanceof Node.SharedFunctionDefinitionNode) {
                this.registerSharedFunction(node, classNode, globalScope)
            }
            else if (node instanceof Node.FunctionDefinitionNode) {
                this.registerFunction(node, classNode)
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
        classNode.behaviourNodes.push(behaviourNode)
    }

    registerConstructor(classNode, constructorNode, scope) {
        if (scope.resolveFunction('_constructor') !== undefined) {
            return new Error('Constructor already defined in this class', node)
        }
        const functionNode = new Node.FunctionDefinitionNode(constructorNode.tokens, '_constructor', new Node.ParameterDefinitionsNode(constructorNode.tokens, []), constructorNode.contentNode)
        scope.setFunction(functionNode)
    }

    registerFunction(node, classNode) {
        if (classNode.scope.resolveFunction(node.functionName) !== undefined) {
            return new Error('Function with name "' + node.functionName + '" already defined in this context', node)
        }
        classNode.scope.setFunction(node)
    }

    registerSharedFunction(node, classNode, globalScope) {
        if (classNode.sharedScope.resolveFunction(node.functionName) !== undefined) {
            return new Error('Function with name "' + node.functionName + '" already defined in this context', node)
        }
        classNode.sharedScope.setFunction(node)

        if (node.functionName == '_update') {
            globalScope.updateClasses.push(classNode)
        }
    }

    registerExtendingClass(classNode, globalScope) {
        const extendedClassNode = globalScope.resolveClass(classNode.ofTypeName)
        if (extendedClassNode === undefined) {
            return new Error('Class of type "' + classNode.ofTypeName + '" not found', classNode)
        }

        classNode.scope.parentScope = extendedClassNode.scope
        classNode.parentClass = extendedClassNode
    }
}