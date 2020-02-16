import * as Node from './nodes'
import { Constant } from '../model/variable'

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
            'Assignment': 21,
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
            '=': this.tokenType.Assignment,
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

        this.expressions = [
            {
                name: 'True',
                match: [
                    {type: 'token', token: 'True'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.ConstantNode(tokens, new Constant(true))
            },
            {
                name: 'False',
                match: [
                    {type: 'token', token: 'False'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.ConstantNode(tokens, new Constant(false))
            },
            {
                name: 'None',
                match: [
                    {type: 'token', token: 'None'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.ConstantNode(tokens, new Constant(undefined))
            },
            {
                name: 'Array',
                match: [
                    {type: 'expressionList', id: 'expressionList'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.ArrayNode(tokens, sourceTree.getNodeWithId(nodes, 'expressionList'))
            },
            {
                name: 'GetBehaviour',
                match: [
                    {type: 'token', token: 'Get'},
                    {type: 'token', token: 'Behaviour'},
                    {type: 'name', id: 'className'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.GetBehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'))
            },
            {
                name: 'LoadSprite',
                match: [
                    {type: 'token', token: 'Load'},
                    {type: 'token', token: 'Sprite'},
                    {type: 'expression', id: 'expression'}
                ],
                node: (tokens, nodes, sourceTree) => new Node.LoadSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'LoadTilemap',
                match: [
                    {type: 'token', token: 'Load'},
                    {type: 'token', token: 'Tilemap'},
                    {type: 'expression', id: 'tilemap', endTokens: ['With']},
                ],
                node: (tokens, nodes, sourceTree) => new Node.LoadTilemapNode(tokens, sourceTree.getNodeWithId(nodes, 'tilemap'))
            },
            {
                name: 'FunctionCall',
                match: [
                    {type: 'variable', id: 'name'},
                    {type: 'parameterList', id: 'parameters'}
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionCallNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            {
                name: 'ClassScope',
                match: [
                    {type: 'name', id: 'className'},
                    {type: 'token', token: '.'},
                    {type: 'expression', id: 'expression'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionCallNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            {
                name: 'ParameterAssignment',
                match: [
                    {type: 'variable', id: 'variable'},
                    {type: 'token', token: '='},
                    {type: 'expression', id: 'expression'}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ParameterAssignmentNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'NewObject',
                match: [
                    {type: 'token', token: 'New'},
                    {type: 'name', id: 'className'},
                    {type: 'parameterList', id: 'parameters'}
                ],
                node: (tokens, nodes, sourceTree) => new Node.NewObjectNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            {
                name: 'InvokeNativeFunction',
                match: [
                    {type: 'token', token: 'Invoke'},
                    {type: 'variable', id: 'functionName'},
                    {type: 'parameterList', id: 'parameters'},
                    {type: 'token', token: 'In'},
                    {type: 'name', id: 'className'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.InvokeNativeFunctionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'functionName'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.nativeClasses)
            },
        ]

        this.statements = [
            {
                name: 'SingleLineIf',
                match: [
                    {type: 'token', token: 'If'},
                    {type: 'expression', id: 'expression', endTokens: ['Then']},
                    {type: 'token', token: 'Then'},
                    {type: 'statement', id: 'then'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'token', code: this.tokenType.EOL},
                            {type: 'token', token: 'Else'},
                            {type: 'statement', id: 'else'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            {
                name: 'MultiLineIf',
                match: [
                    {type: 'token', token: 'If'},
                    {type: 'expression', id: 'expression', endTokens: ['Then']},
                    {type: 'token', token: 'Then'},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['Else', 'End'], id: 'then'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'token', token: 'Else'},
                            {type: 'token', code: this.tokenType.EOL},
                            {type: 'subtree', endTokens: ['End'], id: 'else'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IfNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'then'), sourceTree.getNodeWithId(nodes, 'else'))
            },
            {
                name: 'SingleLineWhile',
                match: [
                    {type: 'token', token: 'While'},
                    {type: 'expression', id: 'expression', endTokens: ['Do']},
                    {type: 'token', token: 'Do'},
                    {type: 'statement', id: 'content'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'MultiLineWhile',
                match: [
                    {type: 'token', token: 'While'},
                    {type: 'expression', id: 'expression', endTokens: ['Do']},
                    {type: 'token', token: 'Do'},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WhileNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SingleLineRepeat',
                match: [
                    {type: 'token', token: 'Repeat'},
                    {type: 'statement', id: 'content'},
                    {type: 'token', token: 'Until'},
                    {type: 'expression', id: 'expression'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'MultiLineRepeat',
                match: [
                    {type: 'token', token: 'Repeat'},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['Until'], id: 'content'},
                    {type: 'token', token: 'Until'},
                    {type: 'expression', id: 'expression'},
                    {type: 'token', code: this.tokenType.EOL},
                ],
                node: (tokens, nodes, sourceTree) => new Node.RepeatUntilNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'ForIn',
                match: [
                    {type: 'token', token: 'For'},
                    {type: 'variable', id: 'variable'},
                    {type: 'token', token: 'In'},
                    {type: 'expression', id: 'expression', endTokens: ['Do']},
                    {type: 'token', token: 'Do'},
                    {type: 'subtree', endTokens: ['End'], id: 'do'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForInNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            {
                name: 'ForFromTo',
                match: [
                    {type: 'token', token: 'For'},
                    {type: 'variable', id: 'variable'},
                    {type: 'token', token: 'From'},
                    {type: 'expression', id: 'fromExpression', endTokens: ['To']},
                    {type: 'token', token: 'To'},
                    {type: 'expression', id: 'toExpression', endTokens: ['Do', 'Step']},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'token', token: 'Step'},
                            {type: 'token', token: 'By'},
                            {type: 'expression', id: 'stepExpression', endTokens: ['Do']}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', token: 'Do'},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['End'], id: 'do'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ForFromToNode(tokens, sourceTree.getConstantNameWithId(nodes, 'variable'), sourceTree.getNodeWithId(nodes, 'fromExpression'), sourceTree.getNodeWithId(nodes, 'toExpression'), sourceTree.getNodeWithId(nodes, 'stepExpression'), sourceTree.getNodeWithId(nodes, 'do'))
            },
            {
                name: 'Continue',
                match: [
                    {type: 'token', token: 'Continue'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ContinueNode(tokens)
            },
            {
                name: 'Break',
                match: [
                    {type: 'token', token: 'Break'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BreakNode(tokens)
            },
            {
                name: 'Return',
                match: [
                    {type: 'token', token: 'Return'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'expression', id: 'expression'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ReturnNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Print',
                match: [
                    {type: 'token', token: 'Print'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'expression', id: 'expression'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }}
                ],
                node: (tokens, nodes, sourceTree) => new Node.PrintNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Class',
                match: [
                    {type: 'token', token: 'Class'},
                    {type: 'name', id: 'className'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'token', token: 'Of'},
                            {type: 'token', token: 'Type'},
                            {type: 'name', id: 'ofTypeName'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ClassNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getConstantNameWithId(nodes, 'ofTypeName'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'BehaviourDefinition',
                match: [
                    {type: 'token', token: 'Behaviour'},
                    {type: 'name', id: 'className'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'token', token: 'Of'},
                            {type: 'token', token: 'Type'},
                            {type: 'name', id: 'ofTypeName'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', code: this.tokenType.EOL},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BehaviourDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getConstantNameWithId(nodes, 'ofTypeName'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'FunctionDefinition',
                match: [
                    {type: 'token', token: 'Function'},
                    {type: 'variable', id: 'name'},
                    {type: 'parameterDefinitions', id: 'parameters'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.FunctionDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedFunctionDefinition',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Function'},
                    {type: 'variable', id: 'name'},
                    {type: 'parameterDefinitions', id: 'parameters'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedFunctionDefinitionNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getNodeWithId(nodes, 'parameters'), sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'UpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.UpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Normal, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'PreUpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Pre'},
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.UpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Pre, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'PostUpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Post'},
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.UpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Post, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedUpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedUpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Normal, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedPreUpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Pre'},
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedUpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Pre, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedPostUpdateFunctionDefinition',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Post'},
                    {type: 'token', token: 'Update'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedUpdateFunctionDefinitionNode(tokens, Node.UpdateOrder.Post, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'RunFunction',
                match: [
                    {type: 'token', token: 'Run'},
                    {type: 'expression', id: 'expression'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.RunFunctionNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Property',
                match: [
                    {type: 'token', token: 'Property'},
                    {type: 'parameterDefinitions', id: 'properties'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.PropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
            {
                name: 'SharedProperty',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Property'},
                    {type: 'parameterDefinitions', id: 'properties'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedPropertyNode(tokens, sourceTree.getNodeWithId(nodes, 'properties'))
            },
            {
                name: 'Behaviour',
                match: [
                    {type: 'token', token: 'Behaviour'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'variable', id: 'name'},
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', token: 'Of'},
                    {type: 'token', token: 'Type'},
                    {type: 'name', id: 'className'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'parameterList', id: 'parameters'}
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.BehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getConstantNameWithId(nodes, 'className'), sourceTree.getNodeWithId(nodes, 'parameters'))
            },
            {
                name: 'RequiredBehaviour',
                match: [
                    {type: 'token', token: 'Required'},
                    {type: 'token', token: 'Behaviour'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'variable', id: 'name'},
                            {type: 'token', token: 'Of'},
                            {type: 'token', token: 'Type'},
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'name', id: 'className'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ReferencedBehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getConstantNameWithId(nodes, 'className'), true)
            },
            {
                name: 'OptionalBehaviour',
                match: [
                    {type: 'token', token: 'Optional'},
                    {type: 'token', token: 'Behaviour'},
                    {type: 'group', required: false, group: {
                        match: [
                            {type: 'variable', id: 'name'},
                            {type: 'token', token: 'Of'},
                            {type: 'token', token: 'Type'},
                        ],
                        node: (tokens, nodes, sourceTree) => new Node.GroupNode(tokens, nodes)
                    }},
                    {type: 'name', id: 'className'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ReferencedBehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'name'), sourceTree.getConstantNameWithId(nodes, 'className'), false)
            },
            {
                name: 'IncompatibleBehaviour',
                match: [
                    {type: 'token', token: 'Incompatible'},
                    {type: 'token', token: 'Behaviour'},
                    {type: 'name', id: 'className'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.IncompatibleBehaviourNode(tokens, sourceTree.getConstantNameWithId(nodes, 'className'))
            },
            {
                name: 'Constructor',
                match: [
                    {type: 'token', token: 'Constructor'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ConstructorNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'SharedConstructor',
                match: [
                    {type: 'token', token: 'Shared'},
                    {type: 'token', token: 'Constructor'},
                    {type: 'subtree', endTokens: ['End'], id: 'content'},
                    {type: 'token', token: 'End'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.SharedConstructorNode(tokens, sourceTree.getNodeWithId(nodes, 'content'))
            },
            {
                name: 'WaitForUpdate',
                match: [
                    {type: 'token', token: 'Wait'},
                    {type: 'token', token: 'For'},
                    {type: 'token', token: 'Update'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.WaitForUpdateNode(tokens)
            },
            {
                name: 'ShowSprite',
                match: [
                    {type: 'token', token: 'Show'},
                    {type: 'token', token: 'Sprite'},
                    {type: 'expression', id: 'expression'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.ShowSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'HideSprite',
                match: [
                    {type: 'token', token: 'Hide'},
                    {type: 'token', token: 'Sprite'},
                    {type: 'expression', id: 'expression'},
                    {type: 'token', code: this.tokenType.EOL}
                ],
                node: (tokens, nodes, sourceTree) => new Node.HideSpriteNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Assert',
                match: [
                    {type: 'token', token: 'Assert'},
                    {type: 'expression', id: 'expression', endTokens: ['Else']},
                    {type: 'token', token: 'Else'},
                    {type: 'statement', id: 'statement'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.AssertNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'), sourceTree.getNodeWithId(nodes, 'statement'))
            },
            {
                name: 'Throw',
                match: [
                    {type: 'token', token: 'Throw'},
                    {type: 'expression', id: 'expression'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.ThrowNode(tokens, sourceTree.getNodeWithId(nodes, 'expression'))
            },
            {
                name: 'Assignment',
                match: [
                    {type: 'expression', id: 'variableExpression', endTokens: ['=']},
                    {type: 'token', token: '='},
                    {type: 'expression', id: 'assignmentExpression'},
                ],
                node: (tokens, nodes, sourceTree) => new Node.AssignmentNode(tokens, sourceTree.getNodeWithId(nodes, 'variableExpression'), sourceTree.getNodeWithId(nodes, 'assignmentExpression'))
            },
        ]
    }
}
