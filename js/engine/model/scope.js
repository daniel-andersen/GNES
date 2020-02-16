import { Constant, Variable } from './variable'

export class Scope {

    constructor(parentScope=undefined, type=Scope.Type.Generic) {
        this.parentScope = parentScope
        this.type = type

        this.classNode = undefined
        this.objectInstance = undefined

        this.variables = {}
        this.functions = {}
        this.classes = {}
        this.behaviourDefinitions = {}

        this.updateObjects = {}
        this.updateClasses = {}
        this.behaviourObjects = []
    }

    clone() {
        const scope = new Scope(this.parentScope, this.type)
        scope.classNode = this.classNode
        scope.objectInstance = this.objectInstance
        scope.variables = Object.assign({}, this.variables)
        scope.functions = Object.assign({}, this.functions)
        scope.classes = Object.assign({}, this.classes)
        scope.behaviourDefinitions = Object.assign({}, this.behaviourDefinitions)
        scope.updateObjects = {}
        for (let key of Object.keys(this.updateObjects)) {
            scope.updateObjects[key] = this.updateObjects[key].slice(0)
        }
        scope.updateClasses = {}
        for (let key of Object.keys(this.updateClasses)) {
            scope.updateClasses[key] = this.updateClasses[key].slice(0)
        }
        scope.behaviourObjects = this.behaviourObjects.slice(0)
        return scope
    }

    cloneWithReferences() {
        const scope = new Scope(this.parentScope, this.type)
        scope.classNode = this.classNode
        scope.objectInstance = this.objectInstance
        scope.variables = this.variables
        scope.functions = this.functions
        scope.classes = this.classes
        scope.behaviourDefinitions = this.behaviourDefinitions
        scope.updateObjects = this.updateObjects
        scope.updateClasses = this.updateClasses
        scope.behaviourObjects = this.behaviourObjects
        return scope
    }

    setVariable(name, value) {
        /*
        Sets the given variable in the appropriate scope.
        */

        // Get existing variable (in any scope)
        let currentVariable = this.resolveVariable(name)

        // Overwrite variable if it already exists
        if (currentVariable !== undefined) {
            currentVariable.value = value
        }

        // Create new variable in current scope
        else {
            this.variables[name] = new Variable(name, value)
        }
    }

    setVariableInOwnScope(name, value) {
        /*
        Sets the given variable in this scope, e.g. overrides variable.
        */

        // Overwrite variable if it already exists
        if (name in this.variables) {
            let currentVariable = this.variables[name]
            currentVariable.value = value
        }

        // Create new variable in current scope
        else {
            this.variables[name] = new Variable(name, value)
        }
    }

    resolveVariable(name) {
        /*
        Resolves a variable with the given name in the current scope or parent scopes.
        */

        // Variable set in this scope
        if (name in this.variables) {
            return this.variables[name]
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveVariable(name)
        }

        // Not found
        return undefined
    }

    resolveVariableInOwnScope(name) {
        /*
        Resolves a variable with the given name in the current scope.
        */

        // Variable set in this scope
        return name in this.variables ? this.variables[name] : undefined
    }

    resolveVariableScope(name) {
        /*
        Resolves the scope for a given variable.
        */

        // Variable set in this scope
        if (name in this.variables) {
            return this
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveVariableScope(name)
        }

        // Not found
        return undefined
    }

    setFunction(functionNode) {
        this.functions[functionNode.functionName] = functionNode
    }

    resolveFunction(name) {
        /*
        Resolves a function with the given name in the current scope.
        */

        // Function set in this scope
        if (name in this.functions) {
            return this.functions[name]
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveFunction(name)
        }

        // Not found
        return undefined
    }

    resolveFunctionInOwnScope(name) {
        /*
        Resolves a function with the given name in the current scope only.
        */

        // Function set in this scope
        if (name in this.functions) {
            return this.functions[name]
        }

        // Not found
        return undefined
    }

    setClass(classNode) {
        this.classes[classNode.className] = classNode
    }

    resolveClass(name) {
        /*
        Resolves a class with the given name in the current scope.
        */

        // Class set in this scope
        if (name in this.classes) {
            return this.classes[name]
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveClass(name)
        }

        // Not found
        return undefined
    }

    setBehaviour(behaviourObject) {
        /*
        Sets the given behaviour object in the appropriate scope.
        */

        // Get existing variable (in any scope)
        let currentBehaviour = this.resolveBehaviour(behaviourObject.classNode.className)
        if (currentBehaviour !== undefined) {
            throw {error: 'Behaviour of type ' + behaviourObject.classNode.className + ' already defined in class'}
        }

        // Create new behaviour object in current scope
        this.behaviourObjects.push(behaviourObject)
    }

    resolveBehaviour(className) {
        /*
        Resolves a behaviour with the given class name in the current scope.
        */

        // Behaviour set in this scope
        for (let behaviourObject of this.behaviourObjects) {
            if (behaviourObject.classNode.instanceOf(className)) {
                return behaviourObject
            }
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveBehaviour(className)
        }

        // Not found
        return undefined
    }

    setBehaviourDefinition(classNode) {
        this.behaviourDefinitions[classNode.className] = classNode
    }

    resolveBehaviourDefinition(name) {
        /*
        Resolves a behaviour definition with the given name in the current scope.
        */

        // Behaviour definition set in this scope
        if (name in this.behaviourDefinitions) {
            return this.behaviourDefinitions[name]
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveBehaviourDefinition(name)
        }

        // Not found
        return undefined
    }

    resolveScope(type) {
        /*
        Resolves a (parent) object scope with the given name in the current scope.
        */

        // Check scope type
        if (this.type == type) {
            return this
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveScope(type)
        }

        // Not found
        return undefined
    }

    resolveObjectScopeWithClassName(className) {
        /*
        Resolves a (parent) object scope with the given name in the current scope.
        */

        // Check scope type
        if (this.type == Scope.Type.Object && this.classNode.className == className) {
            return this
        }

        // Resolve in parent scope
        if (this.parentScope !== undefined) {
            return this.parentScope.resolveObjectScopeWithClassName(className)
        }

        // Not found
        return undefined
    }

    addUpdateClass(node, classNode) {
        if (this.updateClasses[node.order] === undefined) {
            this.updateClasses[node.order] = []
        }
        this.updateClasses[node.order].push({
            updateNode: node,
            classNode: classNode
        })
    }

    addUpdateObject(node, object) {
        if (this.updateObjects[node.order] === undefined) {
            this.updateObjects[node.order] = []
        }
        this.updateObjects[node.order].push({
            updateNode: node,
            objectInstance: object
        })
    }
}

Scope.Type = {
    Generic: 0,
    Function: 1,
    Class: 2,
    Object: 3,
    File: 4,
    Global: 5,
}
