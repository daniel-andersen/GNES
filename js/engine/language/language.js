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
            'True': 19,
            'False': 20,
            'Assignment': 21,
            'ParenthesisStart': 22,
            'ParenthesisEnd': 23,
            'StringDelimiter': 24,
            'StringConstant': 25,
            'Colon': 26,
            'Comma': 27,
            'Dot': 28,
            'New': 29,
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
            'True': this.tokenType.True,
            'False': this.tokenType.False,
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
            [`${this.tokenType.GreaterThan}`]: 2,
            [`${this.tokenType.GreaterThanOrEqual}`]: 2,
            [`${this.tokenType.LessThan}`]: 2,
            [`${this.tokenType.LessThanOrEqual}`]: 2,
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
            this.tokenType.True,
            this.tokenType.False,
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
                name: 'ClassScope',
                match: [
                    {type: "name", id: "className"},
                    {type: "token", token: "."},
                    {type: "expression", id: "expression"},
                ],
                node: (tokens, nodes, sourceTree) => {console.log("HEY!"); return new Node.FunctionCallNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'))}
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
                name: 'BehaviourDefinition',
                match: [
                    {type: "token", token: "Behaviour"},
                    {type: "name", id: "className"},
                    {type: "token", code: this.tokenType.EOL},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BehaviourDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getNodeWithId(nodes, 'content'))
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
                name: 'SharedFunctionDefinition',
                match: [
                    {type: "token", token: "Shared"},
                    {type: "token", token: "Function"},
                    {type: "variable", id: 'name'},
                    {type: "parameterDefinitions", id: "parameters"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedFunctionDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'UpdateFunctionDefinition',
                match: [
                    {type: "token", token: "Update"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.UpdateFunctionDefinitionNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedUpdateFunctionDefinition',
                match: [
                    {type: "token", token: "Shared"},
                    {type: "token", token: "Update"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedUpdateFunctionDefinitionNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'RunFunction',
                match: [
                    {type: "token", token: "Run"},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.RunFunctionNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Property',
                match: [
                    {type: "token", token: "Property"},
                    {type: "parameterDefinitions", id: "properties"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.PropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
            {
                name: 'SharedProperty',
                match: [
                    {type: "token", token: "Shared"},
                    {type: "token", token: "Property"},
                    {type: "parameterDefinitions", id: "properties"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedPropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
            {
                name: 'Behaviour',
                match: [
                    {type: "token", token: "Behaviour"},
                    {type: "variable", id: 'name'},
                    {type: "token", token: "Of"},
                    {type: "token", token: "Type"},
                    {type: "name", id: "className"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.BehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getConstantNameWithId(nodes, 'className'))
            },
            {
                name: 'Constructor',
                match: [
                    {type: "token", token: "Constructor"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ConstructorNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedConstructor',
                match: [
                    {type: "token", token: "Shared"},
                    {type: "token", token: "Constructor"},
                    {type: "subtree", end: ["End"], id: "content"},
                    {type: "token", token: "End"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedConstructorNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'WaitForUpdate',
                match: [
                    {type: "token", token: "Wait"},
                    {type: "token", token: "For"},
                    {type: "token", token: "Update"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.WaitForUpdateNode(tokens)
            },
            {
                name: 'LoadSprite',
                match: [
                    {type: "group", required: false, group: {
                        match: [
                            {type: "expression", id: "variableExpression"},
                            {type: "token", token: "="},
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: "Load"},
                    {type: "token", token: "Sprite"},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.LoadSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'variableExpression'), sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'ShowSprite',
                match: [
                    {type: "token", token: "Show"},
                    {type: "token", token: "Sprite"},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ShowSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'HideSprite',
                match: [
                    {type: "token", token: "Hide"},
                    {type: "token", token: "Sprite"},
                    {type: "expression", id: "expression"}
                ],
                node: (tokens, nodes, sourceTree) => new Node.HideSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'InvokeNativeFunction',
                match: [
                    {type: "group", required: false, group: {
                        match: [
                            {type: "expression", id: "variableExpression"},
                            {type: "token", token: "="}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: "token", token: "Invoke"},
                    {type: "variable", id: 'functionName'},
                    {type: "parameterList", id: "parameters"},
                    {type: "token", token: "In"},
                    {type: "name", id: "className"},
                ],
                node: (tokens, nodes, sourceTree) => new Node.InvokeNativeFunctionNode(tokens, sourceTree.getNodeWithId(nodes, 'variableExpression'), sourceTree.getConstantNameWithId(nodes, 'functionName'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.nativeClasses)
            },
        ]
    }
}
