import { Variable, Constant, ObjectInstance } from '../model/variable'
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

export class ParameterAssignmentNode extends StatementNode {
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

export class AssignmentNode extends StatementNode {
    constructor(tokens=[], variableExpressionNode, assignmentExpressionNode) {
        super(tokens)
        this.variableName = undefined
        this.variableExpressionNode = variableExpressionNode
        this.assignmentExpressionNode = assignmentExpressionNode

        this.prepareVariableExpression()
    }

    prepareVariableExpression() {
        if (this.variableExpressionNode instanceof ConstantNode) {
            this.variableName = this.variableExpressionNode.constant.value()
            this.variableExpressionNode = undefined
            return
        }

        let parentNode = undefined
        let arithmeticNode = this.variableExpressionNode

        while (true) {
            if (!(arithmeticNode instanceof ArithmeticNode)) {
                throw 'Expected "." on object'
            }
            if (arithmeticNode.rightSideExpressionNode instanceof ConstantNode) {
                break
            }
            parentNode = arithmeticNode
            arithmeticNode = arithmeticNode.rightSideExpressionNode
        }

        if (parentNode === undefined) {
            this.variableExpressionNode = arithmeticNode.leftSideExpressionNode
        }
        else {
            parentNode.rightSideExpressionNode = arithmeticNode.leftSideExpressionNode
        }
        this.variableName = arithmeticNode.rightSideExpressionNode.constant.value()
    }

    *evaluate(scope) {

        // Evaluate variable expression
        let variableScope = scope

        if (this.variableExpressionNode !== undefined) {
            const variableResult = yield* this.variableExpressionNode.evaluate(scope)
            if (variableResult === undefined || !(variableResult instanceof ObjectInstance)) {
                throw 'Left side expression did not evaluate to an object'
            }
            variableScope = variableResult.scope
        }

        // Evaluate assignment expression
        const assignmentResult = yield* this.assignmentExpressionNode.evaluate(scope)
        if (assignmentResult === undefined) {
            throw 'Result of expression is undefined'
        }

        // Set variable
        const variable = new Variable(this.variableName, assignmentResult)
        variableScope.setVariable(variable)
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
        const result = yield* this.testExpressionNode.evaluate(scope)
        if (result === undefined) {
            throw 'Result of if expression undefined'
        }

        // Perform "true" block
        if (result.isTrue()) {
            yield
            const result = yield* this.thenExpressionNode.evaluate(scope)
            return result
        }

        // Perform "true" block
        else if (this.elseExpressionNode !== undefined) {
            yield
            const result = yield* this.elseExpressionNode.evaluate(scope)
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
            const result = yield* this.testExpressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of while test undefined'
            }

            // Check if expression is false
            if (result.isFalse()) {
                return
            }

            // Perform block
            yield
            yield* this.doBlock.evaluate(scope)
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
            yield* this.doBlock.evaluate(scope)

            // Evaluate test expression
            yield
            const result = yield* this.testExpressionNode.evaluate(scope)
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
            const result = yield* this.expressionNode.evaluate(scope)
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
            result = yield* this.expressionNode.evaluate(scope)
        }

        // Print result
        yield
        let text = ""
        if (result !== undefined) {
            if (result instanceof Constant) {
                text = result.value()
            }
            if (result instanceof ObjectInstance) {
                text = result.classNode.className
            }
        }
        text = text.replace(/\s/g, '&nbsp;')
        document.body.innerHTML += text + '<br/>'
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

        // Create new function scope
        const functionScope = new Scope(scope)

        // Evaluate parameters
        yield
        yield* this.evaluateParameters(scope, functionScope)

        // Resolve function
        const functionNode = scope.resolveFunction(this.functionName)
        if (functionNode === undefined) {
            throw 'Function "' + this.functionName + '" not found'
        }

        // Evaluate unset parameters which has a default value
        yield
        yield* this.evaluateDefaultParameters(scope, functionScope, functionNode)

        // Call function
        yield
        const result = yield* functionNode.contentNode.evaluate(functionScope)
        return result
    }

    *evaluateParameters(scope, functionScope) {
        for (let node of this.parameterListNode.parameterAssignmentNodes) {

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of expression is undefined'
            }

            // Assign variable in new scope
            const variable = new Variable(node.variableName, result)
            functionScope.setVariableInOwnScope(variable)
        }
    }

    *evaluateDefaultParameters(scope, functionScope, functionNode) {
        for (let node of functionNode.parameterDefinitionsNode.nodes) {

            // Get name of variable
            let parameterName = undefined
            if (node instanceof ConstantNode) {
                parameterName = node.constant.value()
            }
            else if (node instanceof ParameterAssignmentNode) {
                parameterName = node.variableName
            }
            else {
                throw 'Parameter definition must be variable declaration or assignment'
            }

            // Check if set in its own scope
            const existingVariable = functionScope.resolveVariableInOwnScope(parameterName)
            if (existingVariable != undefined) {
                continue
            }

            // Make sure default value is present
            if (node instanceof ConstantNode) {
                throw 'Parameter "' + node.constant.value() + '" has no default value and must be provided in function call'
            }

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw 'Result of expression is undefined'
            }

            // Assign variable in new scope
            const variable = new Variable(node.variableName, result)
            functionScope.setVariableInOwnScope(variable)
        }
    }
}

export class NewObjectNode extends ExpressionNode {
    constructor(tokens=[], functionCallNode) {
        super(tokens)
        this.functionCallNode = functionCallNode
        if (!(this.functionCallNode instanceof FunctionCallNode)) {
            throw 'Expected Class name after New'
        }
    }

    *evaluate(scope) {

        // Resolve class
        const classNode = scope.resolveClass(this.functionCallNode.functionName)
        if (classNode === undefined) {
            throw 'Class "' + this.functionCallNode.functionName + '" not found'
        }

        // Create instance of class
        const object = new ObjectInstance(classNode)

        // Evaluate parameters to constructor
        yield
        yield* this.functionCallNode.evaluateParameters(scope, object.scope)

        // Evaluate unset properties
        for (let propertyNode of object.classNode.propertyNodes) {
            for (let node of propertyNode.parameterDefinitionsNode.nodes) {
                if (node instanceof ParameterAssignmentNode) {
                    const currentVariable = object.scope.resolveVariable(node.variableName)
                    if (currentVariable === undefined || (currentVariable !== undefined && currentVariable.type == Variable.Type.Undefined)) {
                        yield
                        const result = yield* node.expressionNode.evaluate(object.scope)
                        object.scope.setVariable(new Variable(node.variableName, result))
                    }
                }
            }
        }

        return object
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

        // Check if object scoping
        if (this.arithmeticToken.token == '.') {
            yield
            const result = yield* this.performObjectOperation(scope)
            return result
        }

        // Evaluate left side of expression
        yield
        const leftSideResult = yield* this.leftSideExpressionNode.evaluate(scope)
        if (leftSideResult === undefined) {
            throw 'Result of left side expression is undefined'
        }

        // Evaluate right side of expression
        yield
        const rightSideResult = yield* this.rightSideExpressionNode.evaluate(scope)
        if (rightSideResult === undefined) {
            throw 'Result of right side expression is undefined'
        }

        // Perform arithmetic operation
        return Arithmetics.performOperation(this.arithmeticToken, leftSideResult, rightSideResult)
    }

    *performObjectOperation(scope) {

        // Evaluate left side of expression
        yield
        const objectInstance = yield* this.leftSideExpressionNode.evaluate(scope)
        if (objectInstance === undefined) {
            throw 'Result of left side expression is undefined'
        }
        if (!(objectInstance instanceof ObjectInstance)) {
            throw 'Left side expression does not evaluate to an object'
        }

        // Evaluate right side of expression - in object scope
        yield
        const result = yield* this.rightSideExpressionNode.evaluate(objectInstance.scope)

        return result
    }
}

export class ClassNode extends Node {
    constructor(tokens=[], className, ofTypeName, contentNode) {
        super(tokens)
        this.className = className
        this.ofTypeName = ofTypeName
        this.contentNode = contentNode
        this.scope = undefined
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
    constructor(tokens=[], parameterAssignmentNodes) {
        super(tokens)
        this.parameterAssignmentNodes = parameterAssignmentNodes
    }
}

export class ParameterDefinitionsNode extends Node {
    constructor(tokens=[], nodes) {
        super(tokens)
        this.nodes = nodes
    }
}

export class PropertyNode extends Node {
    constructor(tokens=[], parameterDefinitionsNode) {
        super(tokens)
        this.parameterDefinitionsNode = parameterDefinitionsNode
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
            result = yield* node.evaluate(scope)
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
            yield* node.evaluate(this.scope)  // Evaluate in its own scope
        }
    }
}

export class ProgramNode extends Node {
    constructor(fileNodes, scope) {
        super([])
        this.fileNodes = fileNodes
        this.scope = scope
    }

    *evaluate(scope) {
        for (let node of this.fileNodes) {
            yield
            yield* node.evaluate(this.scope)  // Evaluate in its own scope
        }
    }
}
