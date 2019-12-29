import Tokenizer from './tokenizer'

export class SourceTree {
    constructor(language) {
        this.language = language
        this.tokenizer = new Tokenizer(language)
    }

    build(files) {
        for (let file of files) {
            const lines = file  // TODO!
            this.buildFromLines(lines)
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
    }

    parseBlock(tokens) {
        tokens = this.duplicateTokens(tokens)

        const blockNode = new BlockNode()

        // Parse nodes
        while (tokens.length > 0) {
            const node = this.parse(tokens)
            if (node === undefined) {
                return blockNode
            }

            // Add node if not newline
            if (!(node instanceof NewlineNode)) {
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
            return new NewlineNode([tokens[0]])
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
        while (tokens.length > 0 && !this.language.statementTokens.includes(tokens[0].type) && tokens[0].type != this.language.tokenType.EOL && tokens[0].type != this.language.tokenType.EOF) {
            expressionTokens.push(tokens[0])
            tokens.splice(0, 1)
        }

        if (expressionTokens.length <= 0) {
            return undefined
        }

        // Constant
        if (expressionTokens.length == 1) {
            return new ConstantNode(expressionTokens)
        }

        // Build arithmetic tree
        const arithmeticNode = this.parseArithmeticNode(expressionTokens)
        if (arithmeticNode !== undefined) {
            return arithmeticNode
        }

        // Function call
        if (expressionTokens[0].type == this.language.tokenType.Variable && expressionTokens[1].type == this.language.tokenType.ParenthesisStart) {
            const assignmentNodes = this.parseParameters(this.findGroupedExpressionTokens(expressionTokens.slice(1)))
            return new FunctionCallNode(expressionTokens, assignmentNodes)
        }

        // Grouped expression
        if (expressionTokens[0].type == this.language.tokenType.ParenthesisStart) {
            return this.parseExpression(this.findGroupedExpressionTokens(expressionTokens))
        }
    }

    parseParameters(tokens) {
        tokens = this.duplicateTokens(tokens)

        let assignmentNodes = []
        let assignmentTokens = []

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            // Add token to assignment
            if (token.type != this.language.tokenType.Comma) {
                assignmentTokens.push(token)
            }

            // Split assignments by comma
            if (token.type == this.language.tokenType.Comma || i === tokens.length - 1) {

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

        return assignmentNodes
    }

    parseAssignmentNode(tokens) {
        tokens = this.duplicateTokens(tokens)

        const assignmentNode = this.parseStatement(tokens)
        if (assignmentNode === undefined || !(assignmentNode instanceof AssignmentNode)) {
            console.log('Expected assignment!')
            console.log(tokens.slice(0))
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
                console.log("Error parsing expression! Too many end parenthesis found!")
                console.log(tokens)
                return undefined
            }

            // Skip tokens inside parenthesis group
            if (parenthesisCount > 0) {
                continue
            }

            // Determine arithmetic operation priority
            if (this.language.arithmeticTokens.includes(token.type) && (arithmeticToken === undefined || this.language.arithmeticOperationPriority[token] > this.language.arithmeticOperationPriority[arithmeticToken])) {
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

        return new ArithmeticNode(tokens, leftSideExpressionNode, arithmeticToken, rightSideExpressionNode)
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
                return tokens.slice(1, i)
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

            // Check any tokens left
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
            if (node instanceof GroupNode) {
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
                return new TokenNode([tokens[0]], tokens[0])
            }
        }
        if ('tokens' in entry) {
            if (tokens[0].type in entry['tokens']) {
                return new TokenNode([tokens[0]], tokens[0])
            }
        }
        return undefined
    }

    matchExpressionEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const expressionNode = this.parseExpression(tokens)
        if (expressionNode instanceof ExpressionNode) {
            return expressionNode
        }
        return undefined
    }

    matchStatementEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const statementNode = this.parseStatement(tokens)
        if (statementNode instanceof StatementNode) {
            return statementNode
        }
        return undefined
    }

    matchGroupEntry(entry, tokens) {
        tokens = this.duplicateTokens(tokens)

        const match = this.matchStatement(entry['group'], tokens)
        if (match !== undefined) {
            return new GroupNode(match.matchedTokens, match.matchedNodes)
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new GroupNode()
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
            return new BlockNode()
        }

        return undefined
    }

    getStatementOfType(tokens, nodes, type) {
        if (type == this.language.statementType.Assignment) {
            return new AssignmentNode(tokens, this.getNodeWithId(nodes, 'variable').token.token, this.getNodeWithId(nodes, 'expression'))
        }
        if (type == this.language.statementType.SinglelineIf || type == this.language.statementType.MultilineIf) {
            return new IfNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'then'), this.getNodeWithId(nodes, 'else'))
        }
        if (type == this.language.statementType.SinglelineWhile || type == this.language.statementType.MultilineWhile) {
            return new WhileNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.SinglelineDoUntil || type == this.language.statementType.MultilineDoUntil) {
            return new DoUntilNode(tokens, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.For) {
            return new ForNode(tokens, this.getNodeWithId(nodes, 'variable').token.token, this.getNodeWithId(nodes, 'expression'), this.getNodeWithId(nodes, 'do'))
        }
        if (type == this.language.statementType.Continue) {
            return new ContinueNode(tokens)
        }
        if (type == this.language.statementType.Break) {
            return new BreakNode(tokens)
        }
        if (type == this.language.statementType.Class) {
            return new ClassNode(tokens, this.getNodeWithId(nodes, 'className').token.token, this.getNodeWithId(nodes, 'ofTypeName').token.token, this.getNodeWithId(nodes, 'content'))
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



export class Node {
    constructor(tokens) {
        this.tokens = tokens
    }
}

export class TokenNode extends Node {
    constructor(tokens=[], token) {
        super(tokens)
        this.token = token
    }
}

export class StatementNode extends Node {
    constructor(tokens=[]) {
        super(tokens)
    }
}

export class AssignmentNode extends StatementNode {
    constructor(tokens=[], variableName, expressionNode) {
        super(tokens)
        this.variableName = variableName
        this.expressionNode = expressionNode
    }
}

export class IfNode extends StatementNode {
    constructor(tokens=[], testExpressionNode, thenExpressionNode, elseExpressionNode) {
        super(tokens)
        this.testExpressionNode = testExpressionNode
        this.thenExpressionNode = thenExpressionNode
        this.elseExpressionNode = elseExpressionNode
    }
}

export class WhileNode extends StatementNode {
    constructor(tokens=[], testExpressionNode, doBlock) {
        super(tokens)
        this.testExpressionNode = testExpressionNode
        this.doBlock = doBlock
    }
}

export class DoUntilNode extends StatementNode {
    constructor(tokens=[], testExpressionNode, doBlock) {
        super(tokens)
        this.testExpressionNode = testExpressionNode
        this.doBlock = doBlock
    }
}

export class ForNode extends StatementNode {
    constructor(tokens=[], variableName, testExpressionNode, doBlock) {
        super(tokens)
        this.variableName = variableName
        this.testExpressionNode = testExpressionNode
        this.doBlock = doBlock
    }
}

export class ContinueNode extends StatementNode {
    constructor(tokens=[]) {
        super(tokens)
    }
}

export class BreakNode extends StatementNode {
    constructor(tokens=[]) {
        super(tokens)
    }
}

export class ExpressionNode extends Node {
    constructor(tokens=[]) {
        super(tokens)
    }
}

export class ConstantNode extends ExpressionNode {
    constructor(tokens=[]) {
        super(tokens)
        this.constant = tokens[0]
    }
}

export class FunctionCallNode extends ExpressionNode {
    constructor(tokens=[], parameterNodes) {
        super(tokens)
        this.functionName = tokens[0]
        this.parameterNodes = parameterNodes
    }
}

export class ArithmeticNode extends ExpressionNode {
    constructor(tokens=[], leftSideExpressionNode, arithmeticToken, rightSideExpressionNode) {
        super(tokens)
        this.leftSideExpressionNode = leftSideExpressionNode
        this.arithmeticToken = arithmeticToken
        this.rightSideExpressionNode = rightSideExpressionNode
    }
}

export class ClassNode extends Node {
    constructor(tokens=[], className, ofTypeName, contentNode) {
        super(tokens)
        this.className = className
        this.ofTypeName = ofTypeName
        this.contentNode = contentNode
    }
}

export class BlockNode extends Node {
    constructor(tokens=[], nodes=[]) {
        super(tokens)
        this.nodes = nodes
    }
}

export class GroupNode extends Node {
    constructor(tokens=[], nodes=[]) {
        super(tokens)
        this.nodes = nodes
    }
}

export class NewlineNode extends Node {
    constructor(tokens=[]) {
        super(tokens)
    }
}
