import { Variable, Constant } from '../model/variable'
import Arithmetics from './arithmetics'

export class Node {
    constructor(tokens) {
        this.tokens = tokens
    }

    *evaluate(scope) {
        yield
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

    *evaluate(scope) {
        const result = yield* this.expressionNode.evaluate(scope)
        if (result === undefined) {
            throw 'Result of expression is undefined'
        }
        const variable = new Variable(this.variableName, result)
        scope.setVariable(variable)
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

    *evaluate(scope) {
        while (true) {

            // Evaluate test expression
            yield
            const result = yield *this.testExpressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of while test undefined'
            }

            // Check if expression is false
            if (result.isFalse()) {
                return
            }

            // Perform block
            yield
            yield *this.doBlock.evaluate(scope)
        }
    }
}

export class DoUntilNode extends StatementNode {
    constructor(tokens=[], testExpressionNode, doBlock) {
        super(tokens)
        this.testExpressionNode = testExpressionNode
        this.doBlock = doBlock
    }

    *evaluate(scope) {
        while (true) {

            // Perform block
            yield
            yield *this.doBlock.evaluate(scope)

            // Evaluate test expression
            yield
            const result = yield *this.testExpressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of while test undefined'
            }

            // Check if expression is false
            if (result.isTrue()) {
                return
            }
        }
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
    constructor(tokens=[], constant) {
        super(tokens)
        this.constant = new Constant(constant)
    }

    *evaluate(scope) {
        if (this.constant.type == Constant.Type.Variable) {
            const variable = scope.resolveVariable(this.constant.value())
            if (variable !== undefined) {
                return variable.value()
            }
            return undefined
        }
        else {
            return this.constant
        }
    }
}

export class FunctionCallNode extends ExpressionNode {
    constructor(tokens=[], functionName, parameterListNode) {
        super(tokens)
        this.functionName = functionName
        this.parameterListNode = parameterListNode
    }
}

export class ArithmeticNode extends ExpressionNode {
    constructor(tokens=[], leftSideExpressionNode, arithmeticToken, rightSideExpressionNode) {
        super(tokens)
        this.leftSideExpressionNode = leftSideExpressionNode
        this.arithmeticToken = arithmeticToken
        this.rightSideExpressionNode = rightSideExpressionNode
    }

    *evaluate(scope) {
        yield
        const leftSideResult = yield *this.leftSideExpressionNode.evaluate(scope)
        if (leftSideResult === undefined) {
            throw 'Result of left side expression is undefined'
        }

        yield
        const rightSideResult = yield *this.rightSideExpressionNode.evaluate(scope)
        if (rightSideResult === undefined) {
            throw 'Result of right side expression is undefined'
        }

        return Arithmetics.performOperation(this.arithmeticToken, leftSideResult, rightSideResult)
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

export class ParameterListNode extends Node {
    constructor(tokens=[], assignmentNodes) {
        super(tokens)
        this.assignmentNodes = assignmentNodes
    }
}

export class BlockNode extends Node {
    constructor(tokens=[], nodes=[]) {
        super(tokens)
        this.nodes = nodes
    }

    *evaluate(scope) {
        for (let node of this.nodes) {
            yield
            yield *node.evaluate(scope)
        }

        //console.log('Block done:', scope.resolveVariable('x').value())
        //console.log('Block done:', scope.resolveVariable('y').value())
        //console.log('Block done:', scope.resolveVariable('z').value())
    }
}

export class GroupNode extends Node {  // Only used internally in SourceTree parsing
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
