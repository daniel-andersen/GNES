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
    Return: 0,
    Continue: 1,
    Break: 2
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
        const variable = new Variable(this.variableName, result.value)
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
            if (variableResult === undefined || variableResult.value === undefined) {
                throw {error: 'Left side expression did not evaluate to an object', node: this.variableExpressionNode}
            }
            variableScope = undefined
            if (variableResult.value instanceof ObjectInstance) {
                variableScope = variableResult.value.scope
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
        const variable = new Variable(this.variableName, assignmentResult.value)
        variableScope.setVariable(variable)

        return new Result(variable, Result.Type.Statement)
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
        loopScope.setVariable(variable)

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
                if (Arithmetics.greaterThan(variable.value(), toResult.value).value()) {
                    return
                }
            }
            else {
                if (Arithmetics.lessThan(variable.value(), toResult.value).value()) {
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
            variable.setValue(Arithmetics.plus(variable.value(), stepResult.value))
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
        yield
        let text = ""
        if (result !== undefined) {
            if (result.value instanceof Constant) {
                text = result.value.value()
            }
            else if (result.value instanceof ObjectInstance) {
                text = result.value.classNode.className
            }
        }
        text = ("" + text).replace(/\s/g, '&nbsp;')
        window.game.console.div.innerHTML += text + '<br/>'
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
        this.constant = constant
    }

    *evaluate(scope) {
        if (this.constant.type == Constant.Type.Variable) {
            const variable = scope.resolveVariable(this.constant.value())
            if (variable !== undefined) {
                return new Result(variable.value(), Result.Type.Expression)
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

export class FunctionCallNode extends ExpressionNode {
    constructor(tokens=[], functionName, parameterListNode) {
        super(tokens)
        this.functionName = functionName
        this.parameterListNode = parameterListNode
    }

    *evaluate(scope) {

        // Create new function scope
        const functionScope = new Scope(scope, Scope.Type.Function)

        // Evaluate parameters
        yield
        yield* this.evaluateParameters(scope, functionScope)

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
            const variable = new Variable(node.variableName, result.value)
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
            const variable = new Variable(node.variableName, result.value)
            functionScope.setVariableInOwnScope(variable)
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

        return new Result(object, Result.Type.Expression)
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
                if (currentVariable === undefined || (currentVariable !== undefined && currentVariable.type == Variable.Type.Undefined)) {
                    yield
                    const result = yield* node.expressionNode.evaluate(scope)
                    if (result === undefined) {
                        throw {error: 'Result of expression is undefined', node: node.expressionNode}
                    }
                    if (result.type !== Result.Type.Expression) {
                        throw {error: 'Expected expression', node: node.expressionNode}
                    }
                    scope.setVariable(new Variable(node.variableName, result.value))
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
                const behaviourObject = result.value
                objectScope.behaviourObjects.push(behaviourObject)
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
            const variable = new Variable(node.variableName, result.value)
            classScope.setVariableInOwnScope(variable)
        }
    }

    registerUpdatableObject(object) {
        let updatable = false

        // Check update function
        updatable |= object.scope.resolveFunction('_update') !== undefined

        // Check behaviour
        for (let objectScope of object.scopes) {
            updatable |= objectScope.classNode.behaviourNodes.length > 0
        }

        // Mark as updatable
        if (updatable) {
            const globalScope = object.scope.resolveScope(Scope.Type.Global)
            globalScope.updateObjects[object.uuid] = object
        }
    }
}

export class ArithmeticNode extends ExpressionNode {
    constructor(tokens=[], leftSideExpressionNode, arithmeticToken, rightSideExpressionNode) {
        super(tokens)
        this.leftSideExpressionNode = leftSideExpressionNode
        this.arithmeticToken = arithmeticToken
        this.rightSideExpressionNode = rightSideExpressionNode

        if (this.leftSideExpressionNode === undefined || this.rightSideExpressionNode === undefined) {
            throw {error: 'Expected expression', node: this}
        }
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
            throw {error: 'Result of left side expression is undefined', node: this.leftSideExpressionNode}
        }
        if (leftSideResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.leftSideExpressionNode}
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
        const arithmeticsResult = Arithmetics.performOperation(this.arithmeticToken, leftSideResult.value, rightSideResult.value)
        return new Result(arithmeticsResult, Result.Type.Expression)
    }

    *performObjectOperation(scope) {

        // Evaluate left side of expression
        yield
        const leftSideResult = yield* this.leftSideExpressionNode.evaluate(scope)
        if (leftSideResult === undefined) {
            throw {error: 'Result of left side expression is undefined', node: this.leftSideExpressionNode}
        }
        if (leftSideResult.type !== Result.Type.Expression) {
            throw {error: 'Expected expression', node: this.leftSideExpressionNode}
        }

        let objectScope = undefined

        const value = leftSideResult.value
        if (value instanceof ObjectInstance) {
            objectScope = value.scope
        }
        if (value instanceof ClassNode) {
            objectScope = value.sharedScope
        }
        if (objectScope === undefined) {
            throw {error: 'Left side expression does not evaluate to an object', node: this.leftSideExpressionNode}
        }

        // Evaluate right side of expression - in object scope
        yield
        const rightSideResult = yield* this.rightSideExpressionNode.evaluate(objectScope)

        return rightSideResult
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
    constructor(tokens=[], className, contentNode) {
        super(tokens, className, undefined, contentNode)
    }
}

export class BehaviourNode extends Node {
    constructor(tokens=[], variableName, className) {
        super(tokens)
        this.variableName = variableName
        this.className = className
        this.newObjectNode = new NewObjectNode(this.tokens, className, new ParameterListNode([], []))
        this.assignmentNode = new AssignmentNode(this.tokens, new ConstantNode([], new Constant(variableName)), this.newObjectNode)
    }

    *evaluate(scope) {

        // Resolve class
        const classNode = scope.resolveBehaviourDefinition(this.className)
        if (classNode === undefined) {
            throw {error: 'Behaviour "' + this.className + '" not found', node: this}
        }

        // Create instance of class
        const object = new ObjectInstance(classNode, scope)

        // Evaluate properties
        yield
        yield *this.evaluateProperties(object)

        // Call constructor function, if any
        yield
        yield* this.evaluateConstructors(object)

        // Set variable
        scope.setVariable(new Variable(this.variableName, object))

        return new Result(object, Result.Type.Expression)
    }

    *evaluateProperties(object) {

        // Evaluate all inherited scopes
        for (let objectScope of object.scopes) {

            // Evaluate all properties
            for (let propertyNode of objectScope.classNode.propertyNodes) {

                // Evaluate all nodes in property
                for (let node of propertyNode.parameterDefinitionsNode.nodes) {

                    // Evaluate assignment
                    if (node instanceof ParameterAssignmentNode) {

                        // Evaluation property
                        yield
                        const result = yield* node.expressionNode.evaluate(objectScope)
                        if (result === undefined) {
                            throw {error: 'Result of expression is undefined', node: node.expressionNode}
                        }
                        if (result.type !== Result.Type.Expression) {
                            throw {error: 'Expected expression', node: node.expressionNode}
                        }
                        objectScope.setVariable(new Variable(node.variableName, result.value))
                    }
                }
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
    constructor(tokens=[], contentNode) {
        super(tokens, '_update', new ParameterDefinitionsNode([], []), contentNode)
    }
}

export class SharedUpdateFunctionDefinitionNode extends SharedFunctionDefinitionNode {
    constructor(tokens=[], contentNode) {
        super(tokens, '_update', new ParameterDefinitionsNode([], []), contentNode)
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

export class LoadSpriteNode extends StatementNode {
    constructor(tokens=[], variableExpressionNode, expressionNode) {
        super(tokens)
        this.variableExpressionNode = variableExpressionNode
        this.expressionNode = expressionNode

        this.newObjectNode = new NewObjectNode(undefined, "Sprite", new ParameterListNode(this.tokens, []))
        this.assignmentNode = undefined
        if (this.variableExpressionNode !== undefined) {
            this.assignmentNode = new AssignmentNode(this.variableExpressionNode.tokens, this.variableExpressionNode, this.newObjectNode)
        }
        this.loadNode = new FunctionCallNode(this.tokens, "load", new ParameterListNode(this.tokens, [new ParameterAssignmentNode(expressionNode.tokens, "filename", this.expressionNode)]))
    }

    *evaluate(scope) {

        // Evaluate assignment
        yield
        const node = this.assignmentNode || this.newObjectNode
        const result = yield* node.evaluate(scope)

        // Get object scope
        let objectScope = result.value instanceof Variable ? result.value.value().scope : result.value.scope

        // Evaluate load
        yield
        yield* this.loadNode.evaluate(objectScope)

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
        if (!(result.value instanceof ObjectInstance)) {
            throw {error: 'Expected object', node: this.expressionNode}
        }

        // Evaluate function call to sprite.show()
        yield
        yield* this.showNode.evaluate(result.value.scope)
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
        if (!(result.value instanceof ObjectInstance)) {
            throw {error: 'Expected object', node: this.expressionNode}
        }

        // Evaluate function call to sprite.show()
        yield
        yield* this.hideNode.evaluate(result.value.scope)
    }
}

export class InvokeNativeFunctionNode extends StatementNode {
    constructor(tokens=[], variableExpressionNode, functionName, parameterListNode, className, nativeClasses) {
        super(tokens)
        this.variableExpressionNode = variableExpressionNode
        this.functionName = functionName
        this.parameterListNode = parameterListNode
        this.className = className
        this.nativeClasses = nativeClasses

        this.functionCallNode = new FunctionCallNode(undefined, "NativeMethod", this.parameterListNode)
        if (this.variableExpressionNode !== undefined) {
            this.assignmentNode = new AssignmentNode(this.tokens, this.variableExpressionNode, this.functionCallNode)
        }
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

        // Evaluate assignment
        if (this.assignmentNode !== undefined) {
            this.assignmentNode.assignmentExpressionNode = new ConstantNode(this.tokens, result)
            yield
            const assignmentResult = yield* this.assignmentNode.evaluate(scope)
            return assignmentResult
        }
        else {
            return result
        }
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
            if (arithmeticResult.value instanceof ObjectInstance) {
                arithmeticScope = arithmeticResult.value.scope
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
                        classNode.sharedScope.setVariableInOwnScope(new Variable(node.constant.value(), new Constant()))
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
                        classNode.sharedScope.setVariable(new Variable(node.variableName, result.value))
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
