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
        tokens = tokens.slice(0)

        const blockNode = new BlockNode()

        // Parse nodes
        while (tokens.length > 0) {
            const node = this.parse(tokens)
            if (node === undefined) {
                return blockNode
            }

            // Add node
            blockNode.nodes.push(node)
            blockNode.tokens = blockNode.tokens.concat(node.tokens)

            // Remove tokens
            tokens.splice(0, node.tokens.length)
        }

        return blockNode
    }

    parse(tokens) {
        tokens = tokens.slice(0)

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
        tokens = tokens.slice(0)

        // Match all statements
        for (let type of Object.keys(this.language.statements)) {
            const statement = this.matchStatement(this.language.statements[type], tokens, type)
            if (statement !== undefined) {
                return statement
            }
        }

        return undefined
    }

    parseExpression(tokens) {
        tokens = tokens.slice(0)

        // Find end of expression (= any statement token)
        const expressionTokens = []
        while (tokens.length > 0 && !this.language.statementTokens.includes(tokens[0].type) && tokens[0].type != this.language.tokenType.EOL && tokens[0].type != this.language.tokenType.EOF) {
            expressionTokens.push(tokens[0])
            tokens.splice(0, 1)
        }

        if (expressionTokens.length > 0) {
            return new ExpressionNode(expressionTokens)
        }

        return undefined
    }

    matchStatement(statement, tokens, type) {
        tokens = tokens.slice(0)

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

            tokens.splice(0, node.tokens.length)

            matchedNodes.push(node)
            matchedTokens = matchedTokens.concat(node.tokens)

            position += 1
        }

        return new StatementNode(matchedTokens, matchedNodes, type)
    }

    matchEntry(entry, tokens) {
        tokens = tokens.slice(0)

        switch (entry['type']) {
            case 'token': {
                return this.matchTokenEntry(entry, tokens)
            }
            case 'expression': {
                return this.matchExpressionEntry(entry, tokens)
            }
            case 'statement': {
                return this.matchStatementEntry(entry, tokens)
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
        tokens = tokens.slice(0)

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
        tokens = tokens.slice(0)

        const expressionNode = this.parseExpression(tokens)
        if (expressionNode instanceof ExpressionNode) {
            return expressionNode
        }
        return undefined
    }

    matchStatementEntry(entry, tokens) {
        tokens = tokens.slice(0)

        const statementNode = this.parseStatement(tokens)
        if (statementNode instanceof StatementNode) {
            return statementNode
        }
        return undefined
    }

    matchGroupEntry(entry, tokens) {
        tokens = tokens.slice(0)

        const statement = this.matchStatement(entry['group'], tokens)
        if (statement !== undefined) {
            return new GroupNode(statement.tokens, statement)
        }

        const required = 'required' in entry ? entry['required'] : true
        if (!required) {
            return new GroupNode()
        }

        return undefined
    }

    matchSubtreeEntry(entry, tokens) {
        tokens = tokens.slice(0)

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
    constructor(tokens=[], nodes=[], type=undefined) {
        super(tokens)
        this.nodes = nodes
        this.type = type
    }
}

export class ExpressionNode extends Node {
}

export class BlockNode extends Node {
    constructor(tokens=[], nodes=[]) {
        super(tokens)
        this.nodes = nodes
    }
}

export class GroupNode extends Node {
    constructor(tokens=[], node=undefined) {
        super(tokens)
        this.node = node
    }
}

export class NewlineNode extends Node {
    constructor(tokens=[]) {
        super(tokens)
    }
}
