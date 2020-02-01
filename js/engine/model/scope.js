export class Scope {

    constructor(parentScope=undefined, type=Scope.Type.Generic) {
        this.parentScope = parentScope
        this.type = type

        this.variables = {}
        this.functions = {}
        this.classes = {}
        this.components = {}
    }

    clone() {
        const scope = new Scope(this.parentScope, this.type)
        scope.variables = Object.assign({}, this.variables)
        scope.functions = Object.assign({}, this.functions)
        scope.classes = Object.assign({}, this.classes)
        scope.components = Object.assign({}, this.components)
        return scope
    }

    cloneWithReferences() {
        const scope = new Scope(this.parentScope, this.type)
        scope.variables = this.variables
        scope.functions = this.functions
        scope.classes = this.classes
        scope.components = this.components
        return scope
    }

    setVariable(variable) {
        /*
        Sets the given variable in the appropriate scope.
        */

        // Get existing variable (in any scope)
        let currentVariable = this.resolveVariable(variable.name)

        // Overwrite variable if it already exists
        if (currentVariable !== undefined) {
            currentVariable.setValue(variable.value())
        }

        // Create new variable in current scope
        else {
            this.variables[variable.name] = variable
        }
    }

    setVariableInOwnScope(variable) {
        /*
        Sets the given variable in this scope, e.g. overrides variable.
        */

        // Overwrite variable if it already exists
        if (name in this.variables) {
            let currentVariable = this.variables[name]
            currentVariable.setValue(variable.value())
        }

        // Create new variable in current scope
        else {
            this.variables[variable.name] = variable
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
}

Scope.Type = {
    Generic: 0,
    Function: 1,
    Class: 2,
    Object: 3,
    File: 4,
    Global: 5,
}
