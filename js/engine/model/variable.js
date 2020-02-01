import { Scope } from './scope'
import * as Node from '../language/nodes'
import Util from '../util/util'

export class Variable {
    constructor(name, value) {
        this.name = name
        this.setValue(value)
    }

    setValue(value) {
        this.rawValue = value

        if (value === undefined || (this.rawValue instanceof Constant && this.rawValue.type == Constant.Type.Undefined)) {
            this.type = Variable.Type.Undefined
        }
        else if (this.rawValue instanceof Constant) {
            this.type = Variable.Type.Constant
        }
        else if (this.rawValue instanceof ObjectInstance) {
            this.type = Variable.Type.ObjectInstance
        }
        else {
            throw 'Unknown variable type "' + value + '"'
        }
    }

    value() {
        return this.rawValue
    }

    isTrue() {
        if (this.rawValue instanceof Constant) {
            return this.rawValue.isTrue()
        }
        return true
    }

    isFalse() {
        if (this.rawValue instanceof Constant) {
            return this.rawValue.isFalse()
        }
        return false
    }
}

Variable.Type = {
    Unknown: -1,
    Constant: 0,
    ObjectInstance: 1,
    Undefined: 2
}


export class Constant {
    constructor(value=undefined) {
        this.rawValue = value

        if (value === undefined) {
            this.type = Constant.Type.Undefined
        }
        else if (typeof(this.rawValue) == typeof(true)) {
            this.type = Constant.Type.Boolean
        }
        else if (!isNaN(this.rawValue)) {
            this.type = Constant.Type.Number
            this.rawValue = +this.rawValue  // Convert into number if string
        }
        else if (typeof(this.rawValue) == 'string' && this.rawValue.length > 0 && this.rawValue.charAt(0) == '"') {
            this.type = Constant.Type.String
        }
        else if (this.rawValue == 'True') {
            this.type = Constant.Type.Boolean
            this.rawValue = true
        }
        else if (this.rawValue == 'False') {
            this.type = Constant.Type.Boolean
            this.rawValue = false
        }
        else {
            this.type = Constant.Type.Variable
        }
    }

    value() {
        if (this.type == Constant.Type.String) {
            return this.rawValue.slice(1, this.rawValue.length - 1)
        } else {
            return this.rawValue
        }
    }

    isTrue() {
        if (this.type == Constant.Type.Boolean || this.type == Constant.Type.Number) {
            return this.value() == true
        }
        return true
    }

    isFalse() {
        if (this.type == Constant.Type.Boolean || this.type == Constant.Type.Number) {
            return this.value() == false
        }
        return false
    }
}

Constant.Type = {
    Unknown: -1,
    Boolean: 0,
    Number: 1,
    String: 2,
    Variable: 3,
    Undefined: 4
}

export class ObjectInstance {
    constructor(classNode) {
        this.classNode = classNode
        this.uuid = Util.uuid()

        this.scope = undefined
        this.scopes = []

        // Build scope hierarcy
        for (let inheritedClass of this.classNode.classHierarcy()) {

            // Class scope (shared)
            const parentScope = this.scope !== undefined ? this.scope : classNode.scope.resolveScope(Scope.Type.Global)
            const classScope = inheritedClass.sharedScope.cloneWithReferences()
            classScope.type = Scope.Type.Class
            classScope.parentScope = this.scope !== undefined ? this.scope : classNode.scope.resolveScope(Scope.Type.Global)
            classScope.classNode = inheritedClass

            // Object scope
            const objectScope = inheritedClass.scope.clone()
            objectScope.type = Scope.Type.Object
            objectScope.parentScope = classScope
            objectScope.classNode = inheritedClass

            this.populateScope(objectScope, inheritedClass.propertyNodes)

            this.scopes.push(objectScope)

            this.scope = objectScope
        }
    }

    populateScope(scope, propertyNodes) {

        // Create variables for properties
        for (let propertyNode of propertyNodes) {
            for (let node of propertyNode.parameterDefinitionsNode.nodes) {
                if (node instanceof Node.ConstantNode) {
                    scope.setVariableInOwnScope(new Variable(node.constant.value(), new Constant()))
                }
                if (node instanceof Node.ParameterAssignmentNode) {
                    scope.setVariableInOwnScope(new Variable(node.variableName, new Constant()))
                }
            }
        }
    }
}
