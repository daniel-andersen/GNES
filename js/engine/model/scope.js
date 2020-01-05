export class Scope {

    constructor(parentScope=undefined) {
        this.parentScope = parentScope
        this.variables = {}
        this.functions = {}
        this.classes = {}
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
        Resolves a variable with the given name in the current scope.
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
}
