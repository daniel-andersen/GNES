import { Variable, Constant, ObjectInstance } from '../model/variable'
import { Scope } from '../model/scope'
import Arithmetics from '../interpreter/arithmetics'
import Execution from '../interpreter/execution'

class Result {
    constructor(value=undefined, type=Result.Type.Expression, action=Result.Action.None) {
        this.value = value
        this.type = type
        this.action = action
    }
}

Result.Type = {
    Expression: 0,
    Statement: 1
}

Result.Action = {
    None: 0,
    Return: 1,
    Continue: 2,
    Break: 3
}


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
            throw {error: 'Result of expression is undefined', node: this.expressionNode}
        }
        if (result.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.expressionNode}
        }
        scope.setVariable(this.variableName, result.value)
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
            if (arithmeticNode === undefined) {
                throw {error: 'Unexpected symbol', token: this.tokens[0], node: this}
            }
            if (!(arithmeticNode instanceof ArithmeticNode)) {
                throw {error: 'Unexpected symbol "' + arithmeticNode.tokens[0].token + '"', node: arithmeticNode}
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
            if (variableResult === undefined || variableResult.value === undefined || typeof(variableResult.value.value) !== typeof(Function)) {
                throw {error: 'Left side expression did not evaluate to an object', node: this.variableExpressionNode}
            }
            variableScope = undefined
            if (variableResult.value instanceof Constant && variableResult.value.type === Constant.Type.ObjectInstance) {
                variableScope = variableResult.value.value().scope
            }
            if (variableResult.value instanceof ClassNode) {
                variableScope = variableResult.value.sharedScope
            }
            if (variableScope === undefined) {
                throw {error: 'Left side expression did not evaluate to an object', node: this.variableExpressionNode}
            }
        }

        // Evaluate assignment expression
        const assignmentResult = yield* this.assignmentExpressionNode.evaluate(scope)
        if (assignmentResult === undefined) {
            throw {error: 'Result of expression is undefined', node: this.assignmentExpressionNode}
        }
        if (assignmentResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.assignmentExpressionNode}
        }

        // Set variable
        variableScope.setVariable(this.variableName, assignmentResult.value)

        return new Result(assignmentResult.value, Result.Type.Statement)
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
            throw {error: 'Result of if expression undefined', node: this.testExpressionNode}
        }
        if (result.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.testExpressionNode}
        }

        // Perform "true" block
        if (result.value.isTrue()) {
            yield
            const result = yield* this.thenExpressionNode.evaluate(scope)
            return result
        }

        // Perform "false" block
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
                throw {error: 'Result of while test undefined', node: this.testExpressionNode}
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: this.testExpressionNode}
            }

            // Check if expression is false
            if (result.value.isFalse()) {
                return
            }

            // Perform block
            yield
            const blockResult = yield* this.doBlock.evaluate(scope)
            if (blockResult !== undefined && blockResult.action === Result.Action.Return) {
                return blockResult
            }
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
            const blockResult = yield* this.doBlock.evaluate(scope)

            if (blockResult !== undefined && blockResult.action === Result.Action.Return) {
                return blockResult
            }

            // Evaluate test expression
            yield
            const result = yield* this.testExpressionNode.evaluate(scope)
            if (result === undefined) {
                throw {error: 'Result of while test undefined', node: this.testExpressionNode}
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: this.testExpressionNode}
            }

            // Check if expression is false
            if (result.value.isTrue()) {
                return
            }
        }
    }
}

export class ForInNode extends StatementNode {
    constructor(tokens=[], variableName, testExpressionNode, doBlock) {
        super(tokens)
        this.variableName = variableName
        this.testExpressionNode = testExpressionNode
        this.doBlock = doBlock
    }
}

export class ForFromToNode extends StatementNode {
    constructor(tokens=[], variableName, fromExpressionNode, toExpressionNode, stepExpressionNode, doBlock) {
        super(tokens)
        this.variableName = variableName
        this.fromExpressionNode = fromExpressionNode
        this.toExpressionNode = toExpressionNode
        this.stepExpressionNode = stepExpressionNode
        this.doBlock = doBlock
    }

    *evaluate(scope) {

        // Evaluate from expression
        yield
        const fromResult = yield* this.fromExpressionNode.evaluate(scope)
        if (fromResult === undefined) {
            throw {error: 'Result of "From" undefined', node: this.fromExpressionNode}
        }
        if (fromResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.fromExpressionNode}
        }

        // Default step by
        let stepResult = new Result(new Constant(1), Result.Type.Expression)

        // Push variable onto scope
        const loopScope = new Scope(scope)
        const variable = new Variable(this.variableName, fromResult.value)
        loopScope.setVariable(this.variableName, fromResult.value)

        while (true) {

            // Evaluate to expression
            yield
            const toResult = yield* this.toExpressionNode.evaluate(loopScope)
            if (toResult === undefined) {
                throw {error: 'Result of "To" undefined', node: this.toExpressionNode}
            }
            if (toResult.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: this.toExpressionNode}
            }

            // Check if reached to
            if (Arithmetics.greaterThan(stepResult.value, new Constant(0))) {
                if (Arithmetics.greaterThan(variable.value, toResult.value).value()) {
                    return
                }
            }
            else {
                if (Arithmetics.lessThan(variable.value, toResult.value).value()) {
                    return
                }
            }

            // Perform block
            yield
            const blockResult = yield* this.doBlock.evaluate(loopScope)
            if (blockResult !== undefined && blockResult.action === Result.Action.Return) {
                return blockResult
            }

            // Evaluate step by expression
            if (this.stepExpressionNode !== undefined) {
                yield
                stepResult = yield* this.stepExpressionNode.evaluate(loopScope)
                if (stepResult === undefined) {
                    throw {error: 'Result of "Step By" undefined', node: this.stepExpressionNode}
                }
                if (stepResult.type !== Result.Type.Expression) {
                    throw {error: 'Expected expression', node: this.stepExpressionNode}
                }
            }

            // Step variable
            variable.value = Arithmetics.plus(variable.value, stepResult.value)
        }
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
            if (result === undefined) {
                return new Result(undefined, Result.Type.Expression, Result.Action.Return)
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: this.expressionNode}
            }
            return new Result(result.value, Result.Type.Expression, Result.Action.Return)
        }
        return new Result(new Constant(undefined), Result.Type.Expression, Result.Action.Return)
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
            if (result === undefined || result.type !== Result.Type.Expression) {
                result = new Constant(undefined)
            }
        }

        // Print result
        let text = ""
        if (result !== undefined) {
            if (result.value instanceof Constant) {
                if (result.value.type === Constant.Type.ObjectInstance) {
                    if (result.value.value().isArray()) {
                        text = this.arrayToString(result.value.value())
                    }
                    else {
                        text = result.value.value().classNode.className
                    }
                }
                else if (result.value.type === Constant.Type.None) {
                    text = 'None'
                }
                else {
                    text = result.value.value()
                }
            }
        }
        text = ("" + text).replace(/\s/g, '&nbsp;')
        window.game.console.div.innerHTML += text + '<br/>'
    }

    arrayToString(objectInstance) {
        let str = '[';
        let delimiter = ''
        for (let constant of objectInstance.scope.entries) {
            str += delimiter + constant.value()
            delimiter = ','
        }
        str += ']'
        return str
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
        this.constant = constant || new Constant(undefined)
    }

    *evaluate(scope) {
        if (this.constant.type == Constant.Type.Variable) {
            const variable = scope.resolveVariable(this.constant.value())
            if (variable !== undefined) {
                return new Result(variable.value, Result.Type.Expression)
            }
            const aClass = scope.resolveClass(this.constant.value())
            if (aClass !== undefined) {
                return new Result(aClass, Result.Type.Expression)
            }
            throw {error: 'Variable ' + this.constant.value() + " undefined", node: this}
        }
        else {
            return new Result(this.constant, Result.Type.Expression)
        }
    }
}

export class ArrayNode extends ExpressionNode {
    constructor(tokens=[], expressionListNode) {
        super(tokens)
        this.expressionListNode = expressionListNode
    }

    *evaluate(scope) {

        // Evaluate expression list
        yield
        const result = yield *this.expressionListNode.evaluate(scope)

        // Create instance of array class
        const object = new ObjectInstance(scope.resolveClass('Array'))

        // Set entries
        object.scope.entries = result.value

        return new Result(new Constant(object), Result.Type.Expression)
    }
}

export class FunctionCallNode extends ExpressionNode {
    constructor(tokens=[], functionName, parameterListNode) {
        super(tokens)
        this.functionName = functionName
        this.parameterListNode = parameterListNode
    }

    *evaluate(scope, parameterEvaluationScope) {

        // Setup parameter evaluate scope
        parameterEvaluationScope = parameterEvaluationScope || scope

        // Create new function scope
        const functionScope = new Scope(scope, Scope.Type.Function)

        // Evaluate parameters
        yield
        yield* this.evaluateParameters(parameterEvaluationScope, functionScope)

        // Resolve function
        const functionNode = scope.resolveFunction(this.functionName)
        if (functionNode === undefined) {
            throw {error: 'Function "' + this.functionName + '" not found', node: this}
        }

        // Evaluate unset parameters which has a default value
        yield
        yield* this.evaluateDefaultParameters(scope, functionScope, functionNode)

        // Call function
        yield
        const result = yield* functionNode.contentNode.evaluate(functionScope)

        if (result != undefined && result.action === Result.Action.Return) {
            result.action = Result.Action.None
        }

        return result
    }

    *evaluateParameters(scope, functionScope) {
        for (let node of this.parameterListNode.parameterAssignmentNodes) {

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw {error: 'Result of expression is undefined', node: node.expressionNode}
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: node.expressionNode}
            }

            // Assign variable in new scope
            functionScope.setVariableInOwnScope(node.variableName, result.value)
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
                throw {error: 'Parameter definition must be variable declaration or assignment', node: node}
            }

            // Check if set in its own scope
            const existingVariable = functionScope.resolveVariableInOwnScope(parameterName)
            if (existingVariable != undefined) {
                continue
            }

            // Make sure default value is present
            if (node instanceof ConstantNode) {
                throw {error: 'Parameter "' + node.constant.value() + '" has no default value and must be provided in function call', node: node}
            }

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw {error: 'Result of expression is undefined', node: node.expressionNode}
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: node.expressionNode}
            }

            // Assign variable in new scope
            functionScope.setVariableInOwnScope(node.variableName, result.value)
        }
    }
}

export class NewObjectNode extends ExpressionNode {
    constructor(tokens=[], className, parameterListNode) {
        super(tokens)
        this.className = className
        this.parameterListNode = parameterListNode
    }

    *evaluate(scope) {

        // Resolve class
        const classNode = scope.resolveClass(this.className)
        if (classNode === undefined) {
            throw {error: 'Class "' + this.className + '" not found', node: this}
        }

        // Create instance of class
        const object = new ObjectInstance(classNode)

        // Define all properties
        this.defineProperties(object)

        // Evaluate parameters to constructor
        yield
        yield* this.evaluateParameters(scope, object.scope)

        // Evaluate unset properties in all inherited scopes
        yield
        yield* this.evaluateUnsetProperties(object)

        // Evaluate behaviours
        yield
        yield* this.evaluateBehaviours(object)

        // Call constructor function, if any
        yield
        yield* this.evaluateConstructors(object)

        // Register as updatable object, if applicable
        this.registerUpdatableObject(object)

        return new Result(new Constant(object), Result.Type.Expression)
    }

    defineProperties(object) {
        for (let objectScope of object.scopes) {
            for (let propertyNode of objectScope.classNode.propertyNodes) {
                for (let node of propertyNode.parameterDefinitionsNode.nodes) {

                    // Assign variable in own scope
                    objectScope.setVariable(node.variableName, new Constant(undefined))
                }
            }
        }
    }

    *evaluateParameters(scope, classScope) {
        for (let node of this.parameterListNode.parameterAssignmentNodes) {

            // Evaluate expression in original scope
            yield
            const result = yield* node.expressionNode.evaluate(scope)
            if (result === undefined) {
                throw {error: 'Result of expression is undefined', node: node.expressionNode}
            }
            if (result.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: node.expressionNode}
            }

            // Assign variable in new scope
            classScope.setVariable(node.variableName, result.value)
        }
    }

    *evaluateUnsetProperties(object) {

        // Evaluate all inherited scopes
        for (let objectScope of object.scopes) {

            // Evaluate all properties
            for (let propertyNode of objectScope.classNode.propertyNodes) {

                // Evaluate property node
                yield
                yield* this.evaluateUnsetPropertiesInPropertyNode(propertyNode, objectScope)
            }
        }
    }

    *evaluateUnsetPropertiesInPropertyNode(propertyNode, scope) {

        // Evaluate all nodes in property
        for (let node of propertyNode.parameterDefinitionsNode.nodes) {

            // Evaluate assignment
            if (node instanceof ParameterAssignmentNode) {
                const currentVariable = scope.resolveVariable(node.variableName)

                // Ensure that is has not already been set
                if (currentVariable === undefined || (currentVariable !== undefined && currentVariable.value.type == Constant.Type.None)) {
                    yield
                    const result = yield* node.expressionNode.evaluate(scope)
                    if (result === undefined) {
                        throw {error: 'Result of expression is undefined', node: node.expressionNode}
                    }
                    if (result.type !== Result.Type.Expression) {
                        throw {error: 'Expected expression', node: node.expressionNode}
                    }
                    scope.setVariable(node.variableName, result.value)
                }
            }
        }
    }

    *evaluateBehaviours(object) {

        // Evaluate all inherited scopes
        for (let objectScope of object.scopes) {

            // Evaluate all behaviours
            for (let behaviourNode of objectScope.classNode.behaviourNodes) {

                // Evaluate behaviour node
                yield
                const result = yield* behaviourNode.evaluate(objectScope)

                // Add to object behaviours
                const behaviourObject = result.value.value()
                objectScope.setBehaviour(behaviourObject)
            }
        }

        // Evaluate referenced behaviours in behaviours
        for (let objectScope of object.scopes) {

            // Evaluate all behaviours
            for (let behaviourNode of objectScope.classNode.behaviourNodes) {

                // Get behaviour object
                const behaviourObject = objectScope.resolveBehaviour(behaviourNode.className)

                // Evaluate referenced behaviours in this object
                yield
                yield* behaviourNode.evaluateReferencedBehaviours(behaviourObject)
            }
        }
    }

    *evaluateConstructors(object) {

        // Evaluate all inherited scopes
        for (let objectScope of object.scopes) {
            const constructorFunctionNode = objectScope.resolveFunctionInOwnScope('_constructor')
            if (constructorFunctionNode !== undefined) {
                yield
                yield* constructorFunctionNode.contentNode.evaluate(objectScope)
            }
        }
    }

    registerUpdatableObject(object) {
        let updatable = false

        // Check update function
        for (let order of UpdateOrder.orders) {
            updatable |= UpdateOrder.updateFunction('order', object.scope) !== undefined
        }

        // Check behaviour
        for (let objectScope of object.scopes) {
            updatable |= objectScope.classNode.behaviourNodes.length > 0
        }

        // Mark as updatable
        if (updatable) {
            const globalScope = object.scope.resolveScope(Scope.Type.Global)
            for (let order of UpdateOrder.orders) {
                const updateFunction = UpdateOrder.updateFunction('order', object.scope)
                if (updateFunction !== undefined) {
                    globalScope.addUpdateObject(updateFunction, object)
                }
            }
        }
    }
}

export class ArithmeticNode extends ExpressionNode {
    constructor(tokens=[], leftSideExpressionNode, arithmeticToken, rightSideExpressionNode) {
        super(tokens)
        this.leftSideExpressionNode = leftSideExpressionNode
        this.arithmeticToken = arithmeticToken
        this.rightSideExpressionNode = rightSideExpressionNode

        if (this.rightSideExpressionNode === undefined) {
            throw {error: 'Expected expression', node: this}
        }
    }

    *evaluate(scope, callerScope=undefined) {

        // Setup caller scope
        callerScope = callerScope || scope

        // Check if object scoping
        if (this.arithmeticToken.token == '.') {
            yield
            const result = yield* this.performObjectOperation(scope, callerScope)
            return result
        }

        // Evaluate left side of expression
        let leftSideResult = undefined

        if (this.leftSideExpressionNode !== undefined) {
            yield
            leftSideResult = yield* this.leftSideExpressionNode.evaluate(scope)
            if (leftSideResult === undefined) {
                throw {error: 'Result of left side expression is undefined', node: this.leftSideExpressionNode}
            }
            if (leftSideResult.type !== Result.Type.Expression) {
                throw {error: 'Expected expression', node: this.leftSideExpressionNode}
            }
        }

        // Evaluate right side of expression
        yield
        const rightSideResult = yield* this.rightSideExpressionNode.evaluate(scope)
        if (rightSideResult === undefined) {
            throw {error: 'Result of right side expression is undefined', node: this.rightSideExpressionNode}
        }
        if (rightSideResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.rightSideExpressionNode}
        }

        // Perform arithmetic operation
        try {
            const arithmeticsResult = Arithmetics.performOperation(this.arithmeticToken, leftSideResult !== undefined ? leftSideResult.value : undefined, rightSideResult.value)
            return new Result(arithmeticsResult, Result.Type.Expression)
        } catch (e) {
            e.node = this
            e.token = this.tokens[0]
            throw e
        }
    }

    *performObjectOperation(scope, callerScope) {

        // Evaluate left side of expression
        const leftSideResult = yield* this.evaluateObjectExpression(this.leftSideExpressionNode, scope, callerScope)

        if (leftSideResult === undefined) {
            throw {error: 'Result of left side expression is undefined', node: this.leftSideExpressionNode}
        }
        if (leftSideResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.leftSideExpressionNode}
        }

        // Get object scope
        let objectScope = undefined

        const value = leftSideResult.value
        if (value instanceof Constant && value.type === Constant.Type.ObjectInstance) {
            objectScope = value.value().scope
        }
        else if (value instanceof ClassNode) {
            objectScope = value.sharedScope
        }
        if (objectScope === undefined) {
            throw {error: 'Left side expression did not evaluate to an object', node: this.leftSideExpressionNode}
        }

        // Evaluate right side of expression
        const rightSideResult = yield* this.evaluateObjectExpression(this.rightSideExpressionNode, objectScope, callerScope)
        return rightSideResult
    }

    *evaluateObjectExpression(node, objectScope, callerScope) {
        yield
        if (node instanceof FunctionCallNode) {
            const rightSideResult = yield* node.evaluate(objectScope, callerScope)
            return rightSideResult
        }
        else if (node instanceof ArithmeticNode) {
            const rightSideResult = yield* node.evaluate(objectScope, callerScope)
            return rightSideResult
        }
        else {
            const rightSideResult = yield* node.evaluate(objectScope)
            return rightSideResult
        }
    }
}

export class ClassNode extends Node {
    constructor(tokens=[], className, ofTypeName, contentNode) {
        super(tokens)
        this.className = className
        this.ofTypeName = ofTypeName
        this.contentNode = contentNode
        this.scope = undefined
        this.parentClass = undefined
    }

    classHierarcy() {
        let classes = []
        let currentClass = this
        while (currentClass !== undefined) {
            classes = [currentClass].concat(classes)
            currentClass = currentClass.parentClass
        }
        return classes
    }

    instanceOf(name) {
        for (let currentClass of this.classHierarcy()) {
            if (currentClass.className == name) {
                return true
            }
        }
        return false
    }
}

export class BehaviourDefinitionNode extends ClassNode {
    constructor(tokens=[], className, ofTypeName, contentNode) {
        super(tokens, className, ofTypeName, contentNode)
    }
}

export class BehaviourNode extends NewObjectNode {
    constructor(tokens=[], variableName, className, parameterListNode) {
        super(tokens, className, parameterListNode)
        this.variableName = variableName || ('___' + className)
        this.className = className
        this.parameterListNode = parameterListNode
    }

    *evaluate(scope) {

        // Resolve class
        const classNode = scope.resolveBehaviourDefinition(this.className)
        if (classNode === undefined) {
            throw {error: 'Behaviour "' + this.className + '" not found', node: this}
        }

        // Create instance of class
        const object = new ObjectInstance(classNode, scope)

        // Define all properties
        this.defineProperties(object)

        // Evaluate parameters to constructor
        yield
        yield* this.evaluateParameters(scope, object.scope)

        // Evaluate unset properties in all inherited scopes
        yield
        yield* this.evaluateUnsetProperties(object)

        // Call constructor function, if any
        yield
        yield* this.evaluateConstructors(object)

        // Set variable
        scope.setVariable(this.variableName, new Constant(object))

        return new Result(new Constant(object), Result.Type.Expression)
    }

    *evaluateReferencedBehaviours(object) {

        // Evaluate all inherited scopes
        for (let objectScope of object.scopes) {

            // Evaluate all referenced behaviours
            for (let behaviourNode of objectScope.classNode.referencedBehaviourNodes) {

                // Evaluate referenced behaviour
                yield
                yield* behaviourNode.evaluate(objectScope)
            }
        }
    }

    *evaluateConstructors(object) {

        // Evaluate all inherited constructors, but in new object's own scope
        for (let objectScope of object.scopes) {
            const constructorFunctionNode = objectScope.resolveFunctionInOwnScope('_constructor')
            if (constructorFunctionNode !== undefined) {
                yield
                yield* constructorFunctionNode.contentNode.evaluate(object.scope)
            }
        }
    }
}

export class ReferencedBehaviourNode extends Node {
    constructor(tokens=[], variableName, className, required) {
        super(tokens)
        this.variableName = variableName
        this.className = className
        this.getBehaviourNode = new GetBehaviourNode(this.tokens, className)
        this.assignmentNode = variableName !== undefined ? new AssignmentNode(this.tokens, new ConstantNode([], new Constant(variableName)), this.getBehaviourNode) : undefined
        this.required = required
    }

    *evaluate(scope) {
        let behaviourObject = undefined

        // Assignment
        if (this.assignmentNode !== undefined) {

            // Define variable
            scope.setVariableInOwnScope(this.variableName, new Constant(undefined))

            // Evaluate assignment node
            yield
            yield *this.assignmentNode.evaluate(scope)

            // Get behaviour object from variable
            const variable = scope.resolveVariableInOwnScope(this.variableName)

            behaviourObject = variable !== undefined ? variable.value : undefined
        }

        // Get behaviour object
        else {
            yield
            const result = yield *this.getBehaviourNode.evaluate(scope)

            behaviourObject = result !== undefined ? result.value : undefined
        }

        // Make sure behaviour has been set if required
        if (this.required) {
            if (behaviourObject === undefined || behaviourObject.type !== Constant.Type.ObjectInstance) {
                throw {error: 'Required behaviour ' + this.className + ' not found in object', node: this}
            }
        }
    }
}

export class IncompatibleBehaviourNode extends Node {
    constructor(tokens=[], className) {
        super(tokens)
        this.className = className
        this.getBehaviourNode = new GetBehaviourNode(this.tokens, className)
    }

    *evaluate(scope) {

        // Evaluate get behaviour node
        yield
        const result = yield *this.getBehaviourNode.evaluate(scope)

        // Make sure behaviour is undefined
        if (result.value !== undefined && result.value.type !== Constant.Type.None) {
            throw {error: 'Incompatible behaviour ' + this.className + ' found in object', node: this}
        }
    }
}

export class GetBehaviourNode extends ExpressionNode {
    constructor(tokens=[], className) {
        super(tokens)
        this.className = className
    }

    *evaluate(scope) {
        const behaviourObject = scope.resolveBehaviour(this.className)

        return new Result(new Constant(behaviourObject), Result.Type.Expression)
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

export class SharedFunctionDefinitionNode extends FunctionDefinitionNode {
    constructor(tokens=[], functionName, parameterDefinitionsNode, contentNode) {
        super(tokens, functionName, parameterDefinitionsNode, contentNode)
    }
}

export class UpdateFunctionDefinitionNode extends FunctionDefinitionNode {
    constructor(tokens=[], order, contentNode) {
        super(tokens, UpdateOrder.updateFunctionName(order || 'Normal'), new ParameterDefinitionsNode([], []), contentNode)
        this.order = order || 'Normal'
    }
}

export class SharedUpdateFunctionDefinitionNode extends SharedFunctionDefinitionNode {
    constructor(tokens=[], order, contentNode) {
        super(tokens, UpdateOrder.updateFunctionName(order || 'Normal'), new ParameterDefinitionsNode([], []), contentNode)
        this.order = order || 'Normal'
    }
}

export class ParameterListNode extends Node {
    constructor(tokens=[], parameterAssignmentNodes) {
        super(tokens)
        this.parameterAssignmentNodes = parameterAssignmentNodes
        for (let node of parameterAssignmentNodes) {
            if (!(node instanceof ParameterAssignmentNode)) {
                throw {error: 'Unexpected symbol "' + node.tokens[0].token + '". Expected parameter assignment.', node: node}
            }
        }
    }
}

export class ParameterDefinitionsNode extends Node {
    constructor(tokens=[], nodes) {
        super(tokens)
        this.nodes = nodes
    }
}

export class ExpressionListNode extends Node {
    constructor(tokens=[], expressionNodes) {
        super(tokens)
        this.expressionNodes = expressionNodes
    }

    *evaluate(scope) {
        let entries = []
        for (let node of this.expressionNodes) {
            if (!(node instanceof ExpressionNode)) {
                throw {error: 'Entry in array must be an expression', node: node}
            }

            yield
            const result = yield* node.evaluate(scope)

            if (result === undefined || result.value === undefined) {
                throw {error: 'Entry in array must evaluate to a value', node: node}
            }

            entries.push(result.value)
        }

        return new Result(entries, Result.Type.Expression)
    }
}

export class PropertyNode extends Node {
    constructor(tokens=[], parameterDefinitionsNode) {
        super(tokens)
        this.parameterDefinitionsNode = parameterDefinitionsNode
    }
}

export class SharedPropertyNode extends PropertyNode {
    constructor(tokens=[], parameterDefinitionsNode) {
        super(tokens, parameterDefinitionsNode)
    }
}

export class ConstructorNode extends Node {
    constructor(tokens=[], contentNode) {
        super(tokens)
        this.contentNode = contentNode
    }
}

export class SharedConstructorNode extends ConstructorNode {
    constructor(tokens=[], contentNode) {
        super(tokens, contentNode)
    }
}

export class UpdateOrderNode extends StatementNode {
    constructor(tokens=[], priority) {
        super(tokens)
        this.priority = priority
    }

    *evaluate(scope) {
        yield
        const result = yield* this.expressionNode.evaluate(scope)
        if (result === undefined) {
            throw {error: 'Expression must evaluate to a value', node: node}
        }
        if (result.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.expressionNode}
        }

    }
}

export class WaitForUpdateNode extends StatementNode {
    constructor(tokens=[]) {
        super(tokens)
    }

    *evaluate(scope) {

        // Register update callback
        let ready = false
        scope.resolveScope(Scope.Type.Global).onUpdateCallbacks.push(() => {
            ready = true
        })

        // Wait for update callback
        while (!ready) {
            yield
        }
    }
}

export class LoadSpriteNode extends ExpressionNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode

        this.newObjectNode = new NewObjectNode(undefined, "Sprite", new ParameterListNode(this.tokens, []))
        this.loadNode = new FunctionCallNode(this.tokens, "load", new ParameterListNode(this.tokens, [new ParameterAssignmentNode(expressionNode.tokens, "filename", this.expressionNode)]))
    }

    *evaluate(scope) {

        // Evaluate new object node
        yield
        const result = yield* this.newObjectNode.evaluate(scope)

        if (!(result.value instanceof Constant) || result.value.type !== Constant.Type.ObjectInstance) {
            throw {error: 'Expected object', node: this.newObjectNode}
        }

        // Get object scope
        const objectScope = result.value.value().scope

        // Evaluate load
        yield
        yield* this.loadNode.evaluate(objectScope, scope)

        return result
    }
}

export class ShowSpriteNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode

        this.showNode = new FunctionCallNode(this.tokens, "show", new ParameterListNode(this.tokens, []))
    }

    *evaluate(scope) {

        // Evaluate expression
        yield
        const result = yield* this.expressionNode.evaluate(scope)
        if (!(result.value instanceof Constant) || result.value.type !== Constant.Type.ObjectInstance) {
            throw {error: 'Expected object', node: this.expressionNode}
        }

        // Evaluate function call to sprite.show()
        yield
        yield* this.showNode.evaluate(result.value.value().scope)
    }
}

export class HideSpriteNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode

        this.hideNode = new FunctionCallNode(this.tokens, "hide", new ParameterListNode(this.tokens, []))
    }

    *evaluate(scope) {

        // Evaluate expression
        yield
        const result = yield* this.expressionNode.evaluate(scope)
        if (!(result.value instanceof Constant) || result.value.type !== Constant.Type.ObjectInstance) {
            throw {error: 'Expected object', node: this.expressionNode}
        }

        // Evaluate function call to sprite.show()
        yield
        yield* this.hideNode.evaluate(result.value.value().scope)
    }
}

export class LoadTilemapNode extends ExpressionNode {
    constructor(tokens=[], tilemapNode) {
        super(tokens)
        this.tilemapNode = tilemapNode

        this.newObjectNode = new NewObjectNode(undefined, "Tilemap", new ParameterListNode(this.tokens, []))
        this.loadNode = new FunctionCallNode(this.tokens, "load", new ParameterListNode(this.tokens, [new ParameterAssignmentNode(tilemapNode.tokens, "filename", this.tilemapNode)]))
    }

    *evaluate(scope) {

        // Evaluate new object node
        yield
        const result = yield* this.newObjectNode.evaluate(scope)

        if (!(result.value instanceof Constant) || result.value.type !== Constant.Type.ObjectInstance) {
            throw {error: 'Expected object', node: this.newObjectNode}
        }

        // Get object scope
        const objectScope = result.value.value().scope

        // Evaluate load
        yield
        yield* this.loadNode.evaluate(objectScope, scope)

        return result
    }
}

export class InvokeNativeFunctionNode extends ExpressionNode {
    constructor(tokens=[], functionName, parameterListNode, className, nativeClasses) {
        super(tokens)
        this.functionName = functionName
        this.parameterListNode = parameterListNode
        this.className = className
        this.nativeClasses = nativeClasses

        this.functionCallNode = new FunctionCallNode(undefined, "NativeMethod", this.parameterListNode)
    }

    *evaluate(scope) {

        // Create new function scope
        const functionScope = new Scope(scope, Scope.Type.Function)

        // Evaluate parameters
        yield
        yield* this.functionCallNode.evaluateParameters(scope, functionScope)

        // Invoke native method
        yield
        let result = yield* this.nativeClasses[this.className][this.functionName](functionScope)
        if (result === undefined) {
            result = new Constant(undefined)
        }

        // Return result
        return new Result(result, Result.Type.Expression)
    }
}

export class RunFunctionNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode

        this.arithmeticNode = undefined
        this.functionCallNode = undefined

        this.prepareVariableExpression()
    }

    prepareVariableExpression() {
        if (this.expressionNode instanceof FunctionCallNode) {
            this.functionCallNode = this.expressionNode
            return
        }

        let parentNode = undefined
        let arithmeticNode = this.expressionNode

        while (true) {
            if (arithmeticNode === undefined) {
                throw {error: 'Unexpected symbol', token: this.tokens[0], node: this}
            }
            if (!(arithmeticNode instanceof ArithmeticNode)) {
                throw {error: 'Unexpected symbol "' + arithmeticNode.tokens[0].token + '"', node: arithmeticNode}
            }
            if (arithmeticNode.rightSideExpressionNode instanceof FunctionNode) {
                break
            }
            parentNode = arithmeticNode
            arithmeticNode = arithmeticNode.rightSideExpressionNode
        }

        if (parentNode === undefined) {
            this.arithmeticNode = arithmeticNode.leftSideExpressionNode
        }
        else {
            parentNode.rightSideExpressionNode = arithmeticNode.leftSideExpressionNode
        }
        this.functionCallNode = arithmeticNode.rightSideExpressionNode
    }

    *evaluate(scope) {

        // Evaluate arithmetic expression
        let arithmeticScope = scope

        if (this.arithmeticNode !== undefined) {
            const arithmeticResult = yield* this.arithmeticNode.evaluate(scope)
            if (arithmeticResult === undefined || arithmeticResult.value === undefined) {
                throw {error: 'Left side expression did not evaluate to an object', node: this.arithmeticNode}
            }
            variableScope = undefined
            if (arithmeticResult.value instanceof Constant && arithmeticResult.value.type === Constant.Type.ObjectInstance) {
                arithmeticScope = arithmeticResult.value.value().scope
            }
            if (arithmeticResult.value instanceof ClassNode) {
                arithmeticScope = arithmeticResult.value.sharedScope
            }
            if (arithmeticScope === undefined) {
                throw {error: 'Left side expression did not evaluate to an object', node: this.arithmeticNode}
            }
        }

        // Create new execution
        window.engine.addExecution(new Execution(this.functionCallNode, arithmeticScope))
    }
}

export class AssertNode extends StatementNode {
    constructor(tokens=[], expressionNode, statementNode) {
        super(tokens)
        this.expressionNode = expressionNode
        this.statementNode = statementNode
    }

    *evaluate(scope) {
        yield
        const result = yield* this.expressionNode.evaluate(scope)

        if (result !== undefined && result.value !== undefined && result.value.value()) {
            return
        }

        yield
        yield* this.statementNode.evaluate(scope)
    }
}

export class ThrowNode extends StatementNode {
    constructor(tokens=[], expressionNode) {
        super(tokens)
        this.expressionNode = expressionNode
    }

    *evaluate(scope) {
        yield
        const result = yield* this.expressionNode.evaluate(scope)

        if (result !== undefined && result.value instanceof Constant) {
            throw {error: result.value.value(), node: this}
        }
        throw {error: '', node: this}
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
            if (result !== undefined && result.action === Result.Action.Return) {
                return result
            }
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
            const result = yield* node.evaluate(this.scope)  // Evaluate in its own scope
            if (result != undefined && result.action === Result.Action.Return) {
                return result
            }
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

        const globalScope = scope.resolveScope(Scope.Type.Global)

        // Evaluate shared class properties
        for (let classNode of Object.values(globalScope.classes)) {
            for (let propertyNode of classNode.sharedPropertyNodes) {
                for (let node of propertyNode.parameterDefinitionsNode.nodes) {

                    // Constant
                    if (node instanceof ConstantNode) {
                        classNode.sharedScope.setVariableInOwnScope(node.constant.value(), new Constant())
                    }

                    // Evaluate assignment
                    if (node instanceof ParameterAssignmentNode) {
                        const currentVariable = classNode.sharedScope.resolveVariable(node.variableName)

                        yield
                        const result = yield* node.expressionNode.evaluate(scope)
                        if (result === undefined) {
                            throw {error: 'Result of expression is undefined', node: node.expressionNode}
                        }
                        if (result.type !== Result.Type.Expression) {
                            throw {error: 'Expected expression', node: node.expressionNode}
                        }
                        classNode.sharedScope.setVariable(node.variableName, result.value)
                    }
                }
            }
        }

        // Run shared constructors
        for (let classNode of Object.values(globalScope.classes)) {
            const constructorFunctionNode = classNode.sharedScope.resolveFunction('_constructor')
            if (constructorFunctionNode !== undefined) {
                yield
                yield* constructorFunctionNode.contentNode.evaluate(classNode.sharedScope)
            }
        }

        // Run program
        for (let node of this.fileNodes) {
            yield
            const result = yield* node.evaluate(this.scope)  // Evaluate in its own scope
            if (result != undefined && result.action === Result.Action.Return) {
                return result
            }
        }
    }
}

export class UpdateOrder {
    static updateFunctionName(order) {
        return '_update_' + order
    }

    static updateFunction(order, scope) {
        return scope.resolveFunction('_update' + order)
    }
}
UpdateOrder.orders = ['First', 'Normal', 'High']
