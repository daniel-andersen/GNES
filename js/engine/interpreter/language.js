import * as Node from './nodes'

export default class Language {
    constructor() {
        this.tokenType = {
            'Unknown': -3,
            'EOF': -2,
            'EOL': -1,
            'Name': 0,
            'Variable': 1,
            'Number': 2,
            'SingleLineComment': 3,
            'MultiLineComment': 4,
            'And': 5,
            'Or': 6,
            'Equal': 7,
            'Not': 8,
            'NotEqual': 9,
            'GreaterThan': 10,
            'GreaterThanOrEqual': 11,
            'LessThan': 12,
            'LessThanOrEqual': 13,
            'Negation': 14,
            'Plus': 15,
            'Minus': 16,
            'Multiply': 17,
            'Divide': 18,
            'Assignment': 19,
            'ParenthesisStart': 20,
            'ParenthesisEnd': 21,
            'StringDelimiter': 22,
            'StringConstant': 23,
            'Colon': 24,
            'Comma': 25,
            'Dot': 26,
            'New': 27,
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
            'New': this.tokenType.New,
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
            this.tokenType.StringConstant,
            this.tokenType.Colon,
            this.tokenType.Comma,
            this.tokenType.Dot,
            this.tokenType.New,
        ])

        this.expressions = [
            {
                name: 'FunctionCall',
                match: [
                    {type: "variable", id: 'name'},
                    {type: "parameterList", id: "parameters"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionCallNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            {
                name: 'ParameterAssignment',
                match: [
                    {type: "variable", id: "variable"},
                    {type: "token", token: "="},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ParameterAssignmentNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'NewObject',
                match: [
                    {type: "token", token: "New"},
                    {type: "name", id: "className"},
                    {type: "parameterList", id: "parameters"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.NewObjectNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
        ]

        this.statements = [
            {
                name: 'SingleLineIf',
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
                    {type: "token", code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            {
                name: 'MultiLineIf',
                match: [
                    {type: "token", token: "If"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Then"},
                    {type: "token", code: this.tokenType.EOL},
                    {type: "subtree", end: ["Else", "End"], id: "then"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Else"},
                            {type: "token", code: this.tokenType.EOL},
                            {type: "subtree", end: ["End"], id: "else"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            {
                name: 'SingleLineWhile',
                match: [
                    {type: "token", token: "While"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "statement", id: "content"},
                    {type: "token", code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'MultiLineWhile',
                match: [
                    {type: "token", token: "While"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "token", code: this.tokenType.EOL},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SingleLineRepeat',
                match: [
                    {type: "token", token: "Repeat"},
                    {type: "statement", id: "content"},
                    {type: "token", token: "Until"},
                    {type: "expression", id: "expression"},
                    {type: "token", code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'MultiLineRepeat',
                match: [
                    {type: "token", token: "Repeat"},
                    {type: "token", code: this.tokenType.EOL},
                    {type: "subtree", end: ["Until"], id: "content"},
                    {type: "token", token: "Until"},
                    {type: "expression", id: "expression"},
                    {type: "token", code: this.tokenType.EOL},
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'ForIn',
                match: [
                    {type: "token", token: "For"},
                    {type: "variable", id: "variable"},
                    {type: "token", token: "In"},
                    {type: "expression", id: "expression"},
                    {type: "token", token: "Do"},
                    {type: "subtree", end: ["End"], id: "do"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForInNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            {
                name: 'ForFromTo',
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
                    {type: "subtree", end: ["End"], id: "do"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForFromToNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'fromExpression'), sourceTree.getNodeWithId(nodes, 'toExpression'), sourceTree.getNodeWithId(nodes, 'stepExpression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            {
                name: 'Assignment',
                match: [
                    {type: "expression", id: "variableExpression"},
                    {type: "token", token: "="},
                    {type: "expression", id: "assignmentExpression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.AssignmentNode(tokens, sourceTree.getNodeWithId(nodes, 'variableExpression'), sourceTree.getNodeWithId(nodes, 'assignmentExpression'))
            },
            {
                name: 'Continue',
                match: [
                    {type: "token", token: "Continue"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ContinueNode(tokens)
            },
            {
                name: 'Break',
                match: [
                    {type: "token", token: "Break"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BreakNode(tokens)
            },
            {
                name: 'Return',
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
            {
                name: 'Print',
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
            {
                name: 'Class',
                match: [
                    {type: "token", token: "Class"},
                    {type: "name", id: "className"},
                    {type: "group", required: false, group: {
                        match: [
                            {type: "token", token: "Of"},
                            {type: "token", token: "Type"},
                            {type: "name", id: "ofTypeName"}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", code: this.tokenType.EOL},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ClassNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getConstantNameWithId(nodes, 'ofTypeName'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'FunctionDefinition',
                match: [
                    {type: "token", token: "Function"},
                    {type: "variable", id: 'name'},
                    {type: "parameterDefinitions", id: "parameters"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'Property',
                match: [
                    {type: "token", token: "Property"},
                    {type: "parameterDefinitions", id: "properties"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.PropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
        ]
    }
}
