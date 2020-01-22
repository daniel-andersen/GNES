import * as Node from './nodes'

export default class Language {
    constructor() {
        this.tokenType = {
            'EOF': -2,
            'EOL': -1,
            'Variable': 0,
            'Number': 1,
            'SingleLineComment': 2,
            'MultiLineComment': 3,
            'And': 4,
            'Or': 5,
            'Equal': 6,
            'NotEqual': 7,
            'GreaterThan': 8,
            'GreaterThanOrEqual': 9,
            'LessThan': 10,
            'LessThanOrEqual': 11,
            'Negation': 12,
            'Plus': 13,
            'Minus': 14,
            'Multiply': 15,
            'Divide': 16,
            'Assignment': 17,
            'ParenthesisStart': 18,
            'ParenthesisEnd': 19,
            'StringDelimiter': 20,
            'StringConstant': 21,
            'Colon': 22,
            'Comma': 23,
            'Dot': 24,
        }

        this.tokenTypes = {
            '#': this.tokenType.SingleLineComment,
            '###': this.tokenType.MultiLineComment,
            'And': this.tokenType.And,
            'Or': this.tokenType.Or,
            '==': this.tokenType.Equal,
            'is': this.tokenType.Equal,
            '!=': this.tokenType.NotEqual,
            'Not': this.tokenType.Negation,
            '>': this.tokenType.GreaterThan,
            '>=': this.tokenType.GreaterThanOrEqual,
            '<': this.tokenType.LessThan,
            '<=': this.tokenType.LessThanOrEqual,
            '+': this.tokenType.Plus,
            '-': this.tokenType.Minus,
            '*': this.tokenType.Multiply,
            '/': this.tokenType.Divide,
            '=': this.tokenType.Assignment,
            '(': this.tokenType.ParenthesisStart,
            ')': this.tokenType.ParenthesisEnd,
            '"': this.tokenType.StringDelimiter,
            ':': this.tokenType.Colon,
            ',': this.tokenType.Comma,
            '.': this.tokenType.Dot,
        }

        this.arithmeticTokens = [
            this.tokenType.And,
            this.tokenType.Or,
            this.tokenType.Plus,
            this.tokenType.Minus,
            this.tokenType.Multiply,
            this.tokenType.Divide,
            this.tokenType.Equal,
            this.tokenType.NotEqual,
            this.tokenType.Not,
            this.tokenType.GreaterThan,
            this.tokenType.GreaterThanOrEqual,
            this.tokenType.LessThan,
            this.tokenType.LessThanOrEqual,
            this.tokenType.Dot,
        ]

        this.arithmeticOperationPriority = {
            [`${this.tokenType.Dot}`]: 7,
            [`${this.tokenType.Not}`]: 6,
            [`${this.tokenType.Divide}`]: 5,
            [`${this.tokenType.Multiply}`]: 4,
            [`${this.tokenType.Plus}`]: 3,
            [`${this.tokenType.Minus}`]: 3,
            [`${this.tokenType.Equal}`]: 2,
            [`${this.tokenType.NotEqual}`]: 2,
            [`${this.tokenType.And}`]: 1,
            [`${this.tokenType.Or}`]: 0,
        }

        this.expressionTokens = this.arithmeticTokens.concat([
            this.tokenType.Variable,
            this.tokenType.Number,
            this.tokenType.ParenthesisStart,
            this.tokenType.ParenthesisEnd,
            this.tokenType.Assignment,
            this.tokenType.StringConstant,
            this.tokenType.Colon,
            this.tokenType.Comma,
            this.tokenType.Dot,
        ])

        this.expressions = [
            // Function call
            {
                match: [
                    {type: "variable", id: 'name'},
                    {type: "parameterList", id: "parameters"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionCallNode(tokens, sourceTree.getTokenWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            // Parameter assignment
            {
                match: [
                    {type: "variable", id: "variable"},
                    {type: "token", token: "="},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ParameterAssignmentNode(tokens, sourceTree.getTokenWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'))
            },
            // New object
            {
                match: [
                    {type: "token", token: "New"},
                    {type: "expression", id: "expression"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.NewObjectNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
        ]

        this.statements = [
            // Single line if
            {
                match: [
                    {type: "token", token: "If"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Then"},
                    {type: "statement", id: "then"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Else"},
                            {type: "statement", id: "else"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            // Multiline if
            {
                match: [
                    {type: "token", token: "If"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Then"},
                    {type: "token", token: this.tokenType.EOL},
                    {type: "subtree", id: "then"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Else"},
                            {type: "token", token: this.tokenType.EOL},
                            {type: "subtree", id: "else"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            // Single line while
            {
                match: [
                    {type: "token", token: "While"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "statement", id: "content"},
                    {type: "token", token: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // Multiline while
            {
                match: [
                    {type: "token", token: "While"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "token", token: this.tokenType.EOL},
                    {type: "subtree", id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // Single line repeat until
            {
                match: [
                    {type: "token", token: "Repeat"},
                    {type: "statement", id: "content"},
                    {type: "token", token: "Until"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // Multiline repeat until
            {
                match: [
                    {type: "token", token: "Repeat"},
                    {type: "token", token: this.tokenType.EOL},
                    {type: "subtree", id: "content"},
                    {type: "token", token: "Until"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: this.tokenType.EOL},
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // For In
            {
                match: [
                    {type: "token", token: "For"},
                    {type: "variable", id: "variable"},
                    {type: "token", token: "In"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "subtree", id: "do"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForInNode(tokens, sourceTree.getTokenWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            // For From To
            {
                match: [
                    {type: "token", token: "For"},
                    {type: "variable", id: "variable"},
                    {type: "token", token: "From"},
                    {type: "expression", id: "fromExpression"},
                    {type: "token", token: "To"},
                    {type: "expression", id: "toExpression"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Step"},
                            {type: "token", token: "By"},
                            {type: "expression", id: "stepExpression"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: "Do"},
                    {type: "subtree", id: "do"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForFromToNode(tokens, sourceTree.getTokenWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'fromExpression'), sourceTree.getNodeWithId(nodes, 'toExpression'), sourceTree.getNodeWithId(nodes, 'stepExpression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            // Assignment
            {
                match: [
                    {type: "expression", id: "variableExpression"},
                    {type: "token", token: "="},
                    {type: "expression", id: "assignmentExpression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.AssignmentNode(tokens, sourceTree.getNodeWithId(nodes, 'variableExpression'), sourceTree.getNodeWithId(nodes, 'assignmentExpression'))
            },
            // Continue
            {
                match: [
                    {type: "token", token: "Continue"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ContinueNode(tokens)
            },
            // Break
            {
                match: [
                    {type: "token", token: "Break"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BreakNode(tokens)
            },
            // Return
            {
                match: [
                    {type: "token", token: "Return"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "expression", id: "expression"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ReturnNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            // Print
            {
                match: [
                    {type: "token", token: "Print"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "expression", id: "expression"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }}
                ],
                node: (tokens, nodes, sourceTree) => new Node.PrintNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            // Class
            {
                match: [
                    {type: "token", token: "Class"},
                    {type: "variable", id: "className"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Of"},
                            {type: "token", token: "Type"},
                            {type: "variable", id: "ofTypeName"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: this.tokenType.EOL},
                    {type: "subtree", id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ClassNode(tokens, sourceTree.getTokenWithId(nodes, 'className'), sourceTree.getTokenWithId(nodes, 'ofTypeName'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // Function definition
            {
                match: [
                    {type: "token", token: "Function"},
                    {type: "variable", id: 'name'},
                    {type: "parameterDefinitions", id: "parameters"},
                    {type: "subtree", id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionDefinitionNode(tokens, sourceTree.getTokenWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            // Property
            {
                match: [
                    {type: "token", token: "Property"},
                    {type: "parameterDefinitions", id: "properties"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.PropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
        ]
    }
}
