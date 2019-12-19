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
            'Negation': 8,
            'Plus': 9,
            'Minus': 10,
            'Multiply': 11,
            'Divide': 12,
            'Assignment': 13,
            'If': 14,
            'Then': 15,
            'Else': 16,
            'End': 17,
            'While': 18,
            'Do': 19,
            'For': 20,
            'In': 21,
            'ParenthesisStart': 22,
            'ParenthesisEnd': 23,
            'StringDelimiter': 24,
            'StringConstant': 25,
            'Continue': 26,
            'Break': 27,
            'Class': 28,
            'Function': 29,
            'Of': 30,
            'Type': 31
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
            '"': this.tokenType.StringDelimiter
        }

        this.statementType = {
            'SinglelineIf': 0,
            'MultilineIf': 1,
            'SinglelineWhile': 2,
            'MultilineWhile': 3,
            'For': 4,
            'Assignment': 5,
            'Expression': 6,
            'Continue': 7,
            'Break': 8,
            'Class': 9,
            'Function': 10
        }

        this.statementTokens = [
            this.tokenType.SingleLineComment,
            this.tokenType.MultiLineComment,
            this.tokenType.Assignment,
            this.tokenType.If,
            this.tokenType.Then,
            this.tokenType.Else,
            this.tokenType.End,
            this.tokenType.While,
            this.tokenType.Do,
            this.tokenType.For,
            this.tokenType.In,
            this.tokenType.Continue,
            this.tokenType.Break,
            this.tokenType.Class,
            this.tokenType.Function
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
            this.tokenType.Not
        ]

        this.arithmeticOperationPriority = {
            [`${this.tokenType.And}`]: 6,
            [`${this.tokenType.Or}`]: 5,
            [`${this.tokenType.Multiply}`]: 4,
            [`${this.tokenType.Divide}`]: 3,
            [`${this.tokenType.Plus}`]: 2,
            [`${this.tokenType.Minus}`]: 2,
            [`${this.tokenType.Equal}`]: 1,
            [`${this.tokenType.NotEqual}`]: 1,
            [`${this.tokenType.Not}`]: 0
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
                {type: "statement", id: "do"},
                {type: "token", token: this.tokenType.EOL}
            ],
            [`${this.statementType.MultilineWhile}`]: [
                {type: "token", token: this.tokenType.While},
                {type: "expression", id: "expression"},
                {type: "token", token: this.tokenType.Do},
                {type: "token", token: this.tokenType.EOL},
                {type: "subtree", id: "do"},
                {type: "token", token: this.tokenType.End}
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
            ]
        }
    }
}
