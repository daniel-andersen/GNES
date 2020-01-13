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
            'ParameterAssignment': 18,
            'If': 19,
            'Then': 20,
            'Else': 21,
            'End': 22,
            'While': 23,
            'Do': 24,
            'Repeat': 25,
            'Until': 26,
            'For': 27,
            'In': 28,
            'ParenthesisStart': 29,
            'ParenthesisEnd': 30,
            'StringDelimiter': 31,
            'StringConstant': 32,
            'Continue': 33,
            'Break': 34,
            'Class': 35,
            'Function': 36,
            'Of': 37,
            'Type': 38,
            'Colon': 39,
            'Comma': 40,
            'Return': 41,
            'Print': 42,
            'Property': 43,
            'New': 44,
            'Dot': 45,
        }

        this.tokenTypes = {
            '#': this.tokenType.SingleLineComment,
            '###': this.tokenType.MultiLineComment,
            'and': this.tokenType.And,
            'or': this.tokenType.Or,
            '==': this.tokenType.Equal,
            'is': this.tokenType.Equal,
            '!=': this.tokenType.NotEqual,
            'not': this.tokenType.Negation,
            '>': this.tokenType.GreaterThan,
            '>=': this.tokenType.GreaterThanOrEqual,
            '<': this.tokenType.LessThan,
            '<=': this.tokenType.LessThanOrEqual,
            '+': this.tokenType.Plus,
            '-': this.tokenType.Minus,
            '*': this.tokenType.Multiply,
            '/': this.tokenType.Divide,
            '=': this.tokenType.Assignment,
            'If': this.tokenType.If,
            'Then': this.tokenType.Then,
            'Else': this.tokenType.Else,
            'End': this.tokenType.End,
            'While': this.tokenType.While,
            'Do': this.tokenType.Do,
            'Repeat': this.tokenType.Repeat,
            'Until': this.tokenType.Until,
            'For': this.tokenType.For,
            'In': this.tokenType.In,
            'Continue': this.tokenType.Continue,
            'Break': this.tokenType.Break,
            'Class': this.tokenType.Class,
            'Function': this.tokenType.Function,
            'Of': this.tokenType.Of,
            'Type': this.tokenType.Type,
            '(': this.tokenType.ParenthesisStart,
            ')': this.tokenType.ParenthesisEnd,
            '"': this.tokenType.StringDelimiter,
            ':': this.tokenType.Colon,
            ',': this.tokenType.Comma,
            'Return': this.tokenType.Return,
            'Print': this.tokenType.Print,
            'Property': this.tokenType.Property,
            'New': this.tokenType.New,
            '.': this.tokenType.Dot,
        }

        this.expressionType = {
            'FunctionCall': 0,
            'ParameterAssignments': 1,
            'NewObject': 2,
            'ArithmeticExpression': 3
        }

        this.statementType = {
            'SinglelineIf': 0,
            'MultilineIf': 1,
            'SinglelineWhile': 2,
            'MultilineWhile': 3,
            'SinglelineRepeatUntil': 4,
            'MultilineRepeatUntil': 5,
            'For': 6,
            'ParameterAssignment': 7,
            'Assignment': 8,
            'Expression': 9,
            'Continue': 10,
            'Break': 11,
            'Class': 12,
            'Function': 13,
            'Return': 14,
            'Print': 15,
            'Property': 16,
        }

        this.statementTokens = [
            this.tokenType.Assignment,
            this.tokenType.SingleLineComment,
            this.tokenType.MultiLineComment,
            this.tokenType.If,
            this.tokenType.Then,
            this.tokenType.Else,
            this.tokenType.End,
            this.tokenType.While,
            this.tokenType.Do,
            this.tokenType.Repeat,
            this.tokenType.Until,
            this.tokenType.For,
            this.tokenType.In,
            this.tokenType.Continue,
            this.tokenType.Break,
            this.tokenType.Class,
            this.tokenType.Function,
            this.tokenType.Return,
            this.tokenType.Print,
            this.tokenType.Property,
        ]

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

        this.expressions = {
            [`${this.expressionType.FunctionCall}`]: [
                {type: "token", token: this.tokenType.Variable, id: 'name'},
                {type: "parameterList", id: "parameters"},
            ],
            [`${this.statementType.ParameterAssignment}`]: [
                {type: "token", token: this.tokenType.Variable, id: "variable"},
                {type: "token", token: this.tokenType.Assignment},
                {type: "expression", id: "expression"}
            ],
            [`${this.expressionType.NewObject}`]: [
                {type: "token", token: this.tokenType.New},
                {type: "expression", id: "expression"},
            ],
        }

        this.statements = {
            [`${this.statementType.SinglelineIf}`]: [
                {type: "token", token: this.tokenType.If},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Then},
                {type: "statement", id: "then"},
                {type: "group", required: false, group: [
                    {type: "token", token: this.tokenType.Else},
                    {type: "statement", id: "else"}
                ]},
                {type: "token", token: this.tokenType.EOL}
            ],
            [`${this.statementType.MultilineIf}`]: [
                {type: "token", token: this.tokenType.If},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Then},
                {type: "token", token: this.tokenType.EOL},
                {type: "subtree", id: "then"},
                {type: "group", required: false, group: [
                    {type: "token", token: this.tokenType.Else},
                    {type: "token", token: this.tokenType.EOL},
                    {type: "subtree", id: "else"}
                ]},
                {type: "token", token: this.tokenType.End}
            ],
            [`${this.statementType.SinglelineWhile}`]: [
                {type: "token", token: this.tokenType.While},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Do},
                {type: "statement", id: "content"},
                {type: "token", token: this.tokenType.EOL}
            ],
            [`${this.statementType.MultilineWhile}`]: [
                {type: "token", token: this.tokenType.While},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Do},
                {type: "token", token: this.tokenType.EOL},
                {type: "subtree", id: "content"},
                {type: "token", token: this.tokenType.End}
            ],
            [`${this.statementType.SinglelineRepeatUntil}`]: [
                {type: "token", token: this.tokenType.Repeat},
                {type: "statement", id: "content"},
                {type: "token", token: this.tokenType.Until},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.EOL}
            ],
            [`${this.statementType.MultilineRepeatUntil}`]: [
                {type: "token", token: this.tokenType.Repeat},
                {type: "token", token: this.tokenType.EOL},
                {type: "subtree", id: "content"},
                {type: "token", token: this.tokenType.Until},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.EOL},
            ],
            [`${this.statementType.For}`]: [
                {type: "token", token: this.tokenType.For},
                {type: "token", token: this.tokenType.Variable, id: "variable"},
                {type: "token", token: this.tokenType.In},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Do},
                {type: "subtree", id: "do"},
                {type: "token", token: this.tokenType.End}
            ],
            [`${this.statementType.Assignment}`]: [
                {type: "expression", id: "variableExpression"},
                {type: "token", token: this.tokenType.Assignment},
                {type: "expression", id: "assignmentExpression"}
            ],
            [`${this.statementType.Continue}`]: [
                {type: "token", token: this.tokenType.Continue}
            ],
            [`${this.statementType.Break}`]: [
                {type: "token", token: this.tokenType.Break}
            ],
            [`${this.statementType.Return}`]: [
                {type: "token", token: this.tokenType.Return},
                {type: "group", required: false, group: [
                    {type: "expression", id: "expression"}
                ]}
            ],
            [`${this.statementType.Print}`]: [
                {type: "token", token: this.tokenType.Print},
                {type: "group", required: false, group: [
                    {type: "expression", id: "expression"}
                ]}
            ],
            [`${this.statementType.Class}`]: [
                {type: "token", token: this.tokenType.Class},
                {type: "token", token: this.tokenType.Variable, id: "className"},
                {type: "group", required: false, group: [
                    {type: "token", token: this.tokenType.Of},
                    {type: "token", token: this.tokenType.Type},
                    {type: "token", token: this.tokenType.Variable, id: "ofTypeName"}
                ]},
                {type: "token", token: this.tokenType.EOL},
                {type: "subtree", id: "content"},
                {type: "token", token: this.tokenType.End}
            ],
            [`${this.statementType.Function}`]: [
                {type: "token", token: this.tokenType.Function},
                {type: "token", token: this.tokenType.Variable, id: 'name'},
                {type: "parameterDefinitions", id: "parameters"},
                {type: "subtree", id: "content"},
                {type: "token", token: this.tokenType.End}
            ],
            [`${this.statementType.Property}`]: [
                {type: "token", token: this.tokenType.Property},
                {type: "parameterDefinitions", id: "properties"},
            ],
        }
    }
}
