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
            'If': 18,
            'Then': 19,
            'Else': 20,
            'End': 21,
            'While': 22,
            'Do': 23,
            'Repeat': 24,
            'Until': 25,
            'For': 26,
            'In': 27,
            'ParenthesisStart': 28,
            'ParenthesisEnd': 29,
            'StringDelimiter': 30,
            'StringConstant': 31,
            'Continue': 32,
            'Break': 33,
            'Class': 34,
            'Function': 35,
            'Of': 36,
            'Type': 37,
            'Colon': 38,
            'Comma': 39,
            'Return': 40,
            'Print': 41,
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
            'if': this.tokenType.If,
            'then': this.tokenType.Then,
            'else': this.tokenType.Else,
            'end': this.tokenType.End,
            'while': this.tokenType.While,
            'do': this.tokenType.Do,
            'repeat': this.tokenType.Repeat,
            'until': this.tokenType.Until,
            'for': this.tokenType.For,
            'in': this.tokenType.In,
            'continue': this.tokenType.Continue,
            'break': this.tokenType.Break,
            'class': this.tokenType.Class,
            'function': this.tokenType.Function,
            'of': this.tokenType.Of,
            'type': this.tokenType.Type,
            '(': this.tokenType.ParenthesisStart,
            ')': this.tokenType.ParenthesisEnd,
            '"': this.tokenType.StringDelimiter,
            ':': this.tokenType.Colon,
            ',': this.tokenType.Comma,
            'return': this.tokenType.Return,
            'print': this.tokenType.Print,
        }

        this.expressionType = {
            'FunctionCall': 0,
            'ParameterAssignments': 1,
            'ArithmeticExpression': 2
        }

        this.statementType = {
            'SinglelineIf': 0,
            'MultilineIf': 1,
            'SinglelineWhile': 2,
            'MultilineWhile': 3,
            'SinglelineRepeatUntil': 4,
            'MultilineRepeatUntil': 5,
            'For': 6,
            'Assignment': 7,
            'Expression': 8,
            'Continue': 9,
            'Break': 10,
            'Class': 11,
            'Function': 12,
            'Return': 13,
            'Print': 14,
        }

        this.statementTokens = [
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
        ]

        this.arithmeticOperationPriority = {
            [`${this.tokenType.And}`]: 6,
            [`${this.tokenType.Or}`]: 5,
            [`${this.tokenType.Divide}`]: 4,
            [`${this.tokenType.Multiply}`]: 3,
            [`${this.tokenType.Plus}`]: 2,
            [`${this.tokenType.Minus}`]: 2,
            [`${this.tokenType.Equal}`]: 1,
            [`${this.tokenType.NotEqual}`]: 1,
            [`${this.tokenType.Not}`]: 0
        }

        this.expressions = {
            [`${this.expressionType.FunctionCall}`]: [
                {type: "token", token: this.tokenType.Variable, id: 'name'},
                {type: "parameterList", id: "parameters"},
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
                {type: "token", token: this.tokenType.Variable, id: "variable"},
                {type: "token", token: this.tokenType.Assignment},
                {type: "expression", id: "expression"}
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
        }
    }
}
