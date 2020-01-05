import { Variable, Constant } from '../model/variable'
import { Scope } from '../model/scope'
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

    *evaluate(scope) {

        // Evaluate test expression
        yield
        const result = yield *this.testExpressionNode.evaluate(scope)
        if (result === undefined) {
            throw 'Result of if expression undefined'
        }

        // Perform "true" block
        if (result.isTrue()) {
            yield
            const result = yield *this.thenExpressionNode.evaluate(scope)
            return result
        }

        // Perform "true" block
        else if (this.elseExpressionNode !== undefined) {
            yield
            const result = yield *this.elseExpressionNode.evaluate(scope)
            return result
        }
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

export class RepeatUntilNode extends StatementNode {
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

export class ReturnNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode
    }

    *evaluate(scope) {
        yield

        if (this.expressionNode !== undefined) {
            const result = yield *this.expressionNode.evaluate(scope)
            return result
        }
    }
}

export class PrintNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode
    }

    *evaluate(scope) {

        // Evaluate expression
        let result = undefined
        if (this.expressionNode !== undefined) {
            yield
            result = yield *this.expressionNode.evaluate(scope)
        }

        // Print result
        yield
        document.body.innerHTML += (result !== undefined ? result.value() : '') + '<br/>'
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

    *evaluate(scope) {

        // Evaluate parameters and get scope
        yield
        const functionCallScope = yield *this.parameterListNode.evaluate(scope)

        // Resolve function
        const functionNode = scope.resolveFunction(this.functionName)
        if (functionNode === undefined) {
            throw 'Function "' + this.functionName + '" not found'
        }

        // Call function
        yield
        const result = yield *functionNode.contentNode.evaluate(functionCallScope)
        return result
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

        // Evaluate left side of expression
        yield
        const leftSideResult = yield *this.leftSideExpressionNode.evaluate(scope)
        if (leftSideResult === undefined) {
            throw 'Result of left side expression is undefined'
        }

        // Evaluate right side of expression
        yield
        const rightSideResult = yield *this.rightSideExpressionNode.evaluate(scope)
        if (rightSideResult === undefined) {
            throw 'Result of right side expression is undefined'
        }

        // Perform arithmetic operation
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

export class FunctionDefinitionNode extends Node {
    constructor(tokens=[], functionName, parameterDefinitionsNode, contentNode) {
        super(tokens)
        this.functionName = functionName
        this.parameterDefinitionsNode = parameterDefinitionsNode
        this.contentNode = contentNode
    }
}

export class ParameterListNode extends Node {
    constructor(tokens=[], assignmentNodes) {
        super(tokens)
        this.assignmentNodes = assignmentNodes
    }

    *evaluate(scope) {
        const parameterListScope = new Scope(scope)

        for (let node of this.assignmentNodes) {

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of expression is undefined'
            }

            // Assign variable in new scope
            const variable = new Variable(node.variableName, result)
            parameterListScope.setVariableInOwnScope(variable)
        }

        return parameterListScope
    }
}

export class ParameterDefinitionsNode extends Node {
    constructor(tokens=[], variableNodes) {
        super(tokens)
        this.variableNodes = variableNodes
    }
}

export class BlockNode extends Node {
    constructor(tokens=[], nodes=[]) {
        super(tokens)
        this.nodes = nodes
    }

    *evaluate(scope) {
        let result = undefined
        for (let node of this.nodes) {
            yield
            result = yield *node.evaluate(scope)
        }
        return result
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

export class FileNode extends Node {
    constructor(tokens=[], nodes, scope) {
        super(tokens)
        this.nodes = nodes
        this.scope = scope
    }

    *evaluate(scope) {
        for (let node of this.nodes) {
            yield
            yield *node.evaluate(this.scope)  // Evaluate in its own scope
        }
    }
}

export class GlobalNode extends Node {
    constructor(nodes, scope) {
        super([])
        this.nodes = nodes
        this.scope = scope
    }

    *evaluate(scope) {
        for (let node of this.nodes) {
            yield
            yield *node.evaluate(this.scope)  // Evaluate in its own scope
        }
    }
}
