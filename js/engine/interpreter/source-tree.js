import Tokenizer from './tokenizer'
import * as Node from './nodes'
import Util from '../util/util'
import { Scope } from '../model/scope'

export class SourceTree {
    constructor(language) {
        this.language = language
        this.tokenizer = new Tokenizer(language)
        this.programNode = undefined
    }

    async build(files) {

        // Create global scope - will be populated with classes through building of source tree
        const globalScope = new Scope()

        // Create source tree
        const fileNodes = []

        for (let filename of files) {
            const fileNode = await this.buildFromFile(filename, globalScope)

            fileNodes.push(fileNode)
        }

        // Create global node
        this.programNode = new Node.ProgramNode(fileNodes, globalScope)

        // Postprocess source tree
        this.postProcess(this.programNode)
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
    }

    async buildFromFile(filename, globalScope) {

        // Read lines from file
        const text = await Util.readTextFile(filename)
        const lines = text.split('\n')

        // Tokenize lines
        const tokens = this.tokenizer.tokenizeLines(lines)

        // Parse lines
        const fileNode = this.parseFile(tokens, globalScope)

        console.log("---------")
        console.log("Result:")
        console.log(fileNode)
        console.log("---------")

        return fileNode
    }

    parseFile(tokens, globalScope) {
        tokens = this.duplicateTokens(tokens)

        const fileScope = new Scope(globalScope)
        const fileNode = new Node.FileNode(tokens, [], fileScope)

        // Parse nodes
        while (tokens.length > 0) {
            const node = this.parse(tokens)
            if (node === undefined) {
                return fileNode
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

    parseBlock(tokens) {
        tokens = this.duplicateTokens(tokens)

        const blockNode = new Node.BlockNode()

        // Parse nodes
        while (tokens.length > 0) {
            const node = this.parse(tokens)
            if (node === undefined) {
                return blockNode
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
        const statementNode = this.parseStatement(tokens)
        if (statementNode !== undefined) {
            return statementNode
        }

        // Parse expression
        const expressionNode = this.parseExpression(tokens)
        if (expressionNode !== undefined) {
            return expressionNode
        }

        return undefined
    }

    parseStatement(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Match all statements
        for (let type of Object.keys(this.language.statements)) {
            const match = this.matchStatement(this.language.statements[type], tokens)
            if (match !== undefined) {
                return this.getStatementOfType(match.matchedTokens, match.matchedNodes, type)
            }
        }

        return undefined
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

            // Not expression token
            if (parenthesisCount == 0 && this.language.statementTokens.includes(tokens[0].type)) {
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
            return undefined
        }

        // Constant
        if (expressionTokens.length == 1) {
            return new Node.ConstantNode(expressionTokens, expressionTokens[0].token)
        }

        // Build arithmetic tree
        const arithmeticNode = this.parseArithmeticNode(expressionTokens)
        if (arithmeticNode !== undefined) {
            return arithmeticNode
        }

        // Match all expressions
        for (let type of Object.keys(this.language.expressions)) {
            const match = this.matchStatement(this.language.expressions[type], expressionTokens)
            if (match !== undefined) {
                return this.getExpressionOfType(match.matchedTokens, match.matchedNodes, type)
            }
        }

        // Grouped expression
        if (expressionTokens[0].type == this.language.tokenType.ParenthesisStart) {
            return this.parseExpression(this.findGroupedExpressionTokens(expressionTokens).groupTokens)
        }

        return undefined
    }

    parseCommaSeperatedTokens(tokens) {
        tokens = this.duplicateTokens(tokens)
        if (tokens.length == 0) {
            return undefined
        }

        // Check starting with parenthesis
        const startParenthesis = tokens[0].type == this.language.tokenType.ParenthesisStart

        // Find parenthesis group
        let innerTokens = []
        let listTokens = []

        if (startParenthesis) {
            const groupedExpressionTokens = this.findGroupedExpressionTokens(tokens)
            if (groupedExpressionTokens === undefined) {
                return undefined
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

                // Add parameter assignment
                const parameterAssignmentNode = this.parseParameterAssignmentNode(currentTokens)
                if (parameterAssignmentNode !== undefined) {
                    listNodes.push(parameterAssignmentNode)
                }

                // Add constant
                else if (currentTokens.length == 1) {
                    const constantNode = new Node.ConstantNode(currentTokens, currentTokens[0].token)
                    listNodes.push(constantNode)
                }

                // Neither assignment, nor constant
                else {
                    return undefined
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
        if (assignmentNode === undefined || !(assignmentNode instanceof Node.AssignmentNode)) {
            return undefined
        }

        // Convert into parameter assignment node
        if (assignmentNode.variableExpressionNode !== undefined) {
            return undefined
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
                console.log('Error parsing expression! Too many end parenthesis found!')
                console.log(tokens)
                return undefined
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
            return undefined
        }

        // Build subtrees
        const leftSideExpressionNode = this.parseExpression(tokens.slice(0, arithmeticTokenPosition))
        const rightSideExpressionNode = this.parseExpression(tokens.slice(arithmeticTokenPosition + 1))

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
        return undefined
    }

    matchStatement(statement, tokens) {
        tokens = this.duplicateTokens(tokens)

        let position = 0

        let matchedNodes = []
        let matchedTokens = []

        // Match statement
        while (position < statement.length) {

            // Check if any tokens left
            if (tokens.length <= 0) {
                return undefined
            }

            // Match entry
            const entry = statement[position]
            const node = this.matchEntry(entry, tokens)

            if (node === undefined) {
                return undefined
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

        return {matchedTokens, matchedNodes}
    }

    matchEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        switch (entry['type']) {
            case 'token': {
                return this.matchTokenEntry(entry, tokens)
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
                return undefined
            }
        }
    }

    matchTokenEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        if ('token' in entry) {
            if (tokens[0].type == entry['token']) {
                return new Node.TokenNode([tokens[0]], tokens[0])
            }
        }
        if ('tokens' in entry) {
            if (tokens[0].type in entry['tokens']) {
                return new Node.TokenNode([tokens[0]], tokens[0])
            }
        }
        return undefined
    }

    matchExpressionEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const expressionNode = this.parseExpression(tokens)
        if (expressionNode instanceof Node.ExpressionNode) {
            return expressionNode
        }
        return undefined
    }

    matchStatementEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const statementNode = this.parseStatement(tokens)
        if (statementNode instanceof Node.StatementNode) {
            return statementNode
        }
        return undefined
    }

    matchParameterListEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const result = this.parseCommaSeperatedTokens(tokens)
        if (result !== undefined) {
            return new Node.ParameterListNode(result.tokens, result.nodes)
        }
        return undefined
    }

    matchParameterDefinitionsEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const result = this.parseCommaSeperatedTokens(tokens)
        if (result !== undefined) {
            return new Node.ParameterDefinitionsNode(result.tokens, result.nodes)
        }
        return undefined
    }

    matchGroupEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const match = this.matchStatement(entry['group'], tokens)
        if (match !== undefined) {
            return new Node.GroupNode(match.matchedTokens, match.matchedNodes)
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new Node.GroupNode()
        }

        return undefined
    }

    matchSubtreeEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const blockNode = this.parseBlock(tokens)
        if (blockNode !== undefined) {
            return blockNode
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new Node.BlockNode()
        }

        return undefined
    }

    getExpressionOfType(tokens, nodes, type) {
        if (type == this.language.expressionType.FunctionCall) {
            return new Node.FunctionCallNode(tokens, this.getTokenWithId(nodes, 'name'), this.getNodeWithId(nodes, 'parameters'))
        }
        if (type == this.language.expressionType.NewObject) {
            return new Node.NewObjectNode(tokens, this.getNodeWithId(nodes, 'expression'))
        }
        return undefined
    }

    getStatementOfType(tokens, nodes, type) {
        if (type == this.language.statementType.Assignment) {
            return new Node.AssignmentNode(tokens, this.getNodeWithId(nodes, 'variableExpression'), this.getNodeWithId(nodes, 'assignmentExpression'))
        }
        if (type == this.language.statementType.ParameterAssignment) {
            return new Node.ParameterAssignmentNode(tokens, this.getTokenWithId(nodes, 'variable'), this.getNodeWithId(nodes, 'expression'))
        }
        if (type == this.language.statementType.SinglelineIf || type == this.language.statementType.MultilineIf) {
            return new Node.IfNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'then'), this.getNodeWithId(nodes, 'else'))
        }
        if (type == this.language.statementType.SinglelineWhile || type == this.language.statementType.MultilineWhile) {
            return new Node.WhileNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'content'))
        }
        if (type == this.language.statementType.SinglelineRepeatUntil || type == this.language.statementType.MultilineRepeatUntil) {
            return new Node.RepeatUntilNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'content'))
        }
        if (type == this.language.statementType.For) {
            return new Node.ForNode(tokens, this.getTokenWithId(nodes, 'variable'), this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.Continue) {
            return new Node.ContinueNode(tokens)
        }
        if (type == this.language.statementType.Break) {
            return new Node.BreakNode(tokens)
        }
        if (type == this.language.statementType.Return) {
            return new Node.ReturnNode(tokens, this.getNodeWithId(nodes, 'expression'))
        }
        if (type == this.language.statementType.Print) {
            return new Node.PrintNode(tokens, this.getNodeWithId(nodes, 'expression'))
        }
        if (type == this.language.statementType.Class) {
            return new Node.ClassNode(tokens, this.getTokenWithId(nodes, 'className'), this.getTokenWithId(nodes, 'ofTypeName'), this.getNodeWithId(nodes, 'content'))
        }
        if (type == this.language.statementType.Function) {
            return new Node.FunctionDefinitionNode(tokens, this.getTokenWithId(nodes, 'name'), this.getNodeWithId(nodes, 'parameters'), this.getNodeWithId(nodes, 'content'))
        }
        if (type == this.language.statementType.Property) {
            return new Node.PropertyNode(tokens, this.getNodeWithId(nodes, 'properties'))
        }
        return undefined
    }

    getNodeWithId(nodes, id) {
        for (let node of nodes) {
            if (node.id == id) {
                return node
            }
        }
        return undefined
    }

    getTokenWithId(nodes, id) {
        for (let node of nodes) {
            if (node.id == id) {
                return node.token.token
            }
        }
        return undefined
    }

    duplicateTokens(tokens) {
        return tokens.slice(0)
    }

    registerClass(classNode, globalScope, fileScope) {
        if (globalScope.resolveClass(classNode.className) !== undefined) {
            throw 'Class with name "' + classNode.className + '" already defined'
        }
        globalScope.setClass(classNode)

        classNode.scope = new Scope(globalScope)
        classNode.propertyNodes = []

        for (let node of classNode.contentNode.nodes) {
            if (node instanceof Node.PropertyNode) {
                this.registerPropertyNode(classNode, node)
            }
            if (node instanceof Node.FunctionDefinitionNode) {
                this.registerFunction(node, classNode.scope)
            }
        }
    }

    registerPropertyNode(classNode, propertyNode) {
        classNode.propertyNodes.push(propertyNode)
    }

    registerFunction(node, scope) {
        if (scope.resolveFunction(node.functionName) !== undefined) {
            throw 'Function with name "' + node.functionName + '" already defined in this context'
        }
        scope.setFunction(node)
    }

    registerExtendingClass(classNode, globalScope) {
        const extendedClassNode = globalScope.resolveClass(classNode.ofTypeName)
        if (extendedClassNode === undefined) {
            throw 'Class of type "' + classNode.ofTypeName + '" not found'
        }

        classNode.scope.parentScope = extendedClassNode.scope
    }
}
