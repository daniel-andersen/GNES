import Tokenizer from './tokenizer'
import * as Node from './nodes'

export class SourceTree {
    constructor(language) {
        this.language = language
        this.tokenizer = new Tokenizer(language)
    }

    build(files) {
        this.blocks = []

        for (let file of files) {
            const lines = file  // TODO!
            const block = this.buildFromLines(lines)

            this.blocks.push(block)
        }
    }

    buildFromLines(lines) {

        // Tokenize lines
        const tokens = this.tokenizer.tokenizeLines(lines)

        // Parse tokens
        const block = this.parseBlock(tokens)

        console.log("---------")
        console.log("Result:")
        console.log(block)
        console.log("---------")

        return block
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
        const statement = this.parseStatement(tokens)
        if (statement !== undefined) {
            return statement
        }

        // Parse expression
        const expression = this.parseExpression(tokens)
        if (expression !== undefined) {
            return expression
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

    parseParameters(tokens) {
        tokens = this.duplicateTokens(tokens)

        // Check starting with parenthesis
        if (tokens.length == 0 || tokens[0].type != this.language.tokenType.ParenthesisStart) {
            return undefined
        }

        // Find parenthesis group
        const groupedExpressionTokens = this.findGroupedExpressionTokens(tokens)
        if (groupedExpressionTokens === undefined) {
            return undefined
        }
        const parameterTokens = groupedExpressionTokens.groupTokens

        // Parse parameters
        let assignmentNodes = []
        let assignmentTokens = []

        for (let i = 0; i < parameterTokens.length; i++) {
            const token = parameterTokens[i]

            // Add token to assignment
            if (token.type != this.language.tokenType.Comma) {
                assignmentTokens.push(token)
            }

            // Split assignments by comma
            if (token.type == this.language.tokenType.Comma || i === parameterTokens.length - 1) {

                // Add assignment
                const assignmentNode = this.parseAssignmentNode(assignmentTokens)
                if (assignmentNode === undefined) {
                    return undefined
                }
                assignmentNodes.push(assignmentNode)

                // Reset assignment tokens
                assignmentTokens = []
            }
        }

        return {tokens: groupedExpressionTokens.allTokens, assignmentNodes: assignmentNodes}
    }

    parseAssignmentNode(tokens) {
        tokens = this.duplicateTokens(tokens)

        const assignmentNode = this.parseStatement(tokens)
        if (assignmentNode === undefined || !(assignmentNode instanceof Node.AssignmentNode)) {
            return undefined
        }
        return assignmentNode
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

        const result = this.parseParameters(tokens)
        if (result !== undefined) {
            return new Node.ParameterListNode(result.tokens, result.assignmentNodes)
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
            return new Node.FunctionCallNode(tokens, this.getNodeWithId(nodes, 'variable').token.token, this.getNodeWithId(nodes, 'parameters'))
        }
        return undefined
    }

    getStatementOfType(tokens, nodes, type) {
        if (type == this.language.statementType.Assignment) {
            return new Node.AssignmentNode(tokens, this.getNodeWithId(nodes, 'variable').token.token, this.getNodeWithId(nodes, 'expression'))
        }
        if (type == this.language.statementType.SinglelineIf || type == this.language.statementType.MultilineIf) {
            return new Node.IfNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'then'), this.getNodeWithId(nodes, 'else'))
        }
        if (type == this.language.statementType.SinglelineWhile || type == this.language.statementType.MultilineWhile) {
            return new Node.WhileNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.SinglelineDoUntil || type == this.language.statementType.MultilineDoUntil) {
            return new Node.DoUntilNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.For) {
            return new Node.ForNode(tokens, this.getNodeWithId(nodes, 'variable').token.token, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.Continue) {
            return new Node.ContinueNode(tokens)
        }
        if (type == this.language.statementType.Break) {
            return new Node.BreakNode(tokens)
        }
        if (type == this.language.statementType.Class) {
            return new Node.ClassNode(tokens, this.getNodeWithId(nodes, 'className').token.token, this.getNodeWithId(nodes, 'ofTypeName').token.token, this.getNodeWithId(nodes, 'content'))
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

    duplicateTokens(tokens) {
        return tokens.slice(0)
    }
}
