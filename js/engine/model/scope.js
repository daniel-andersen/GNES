export class Scope {

    constructor(parentScope=undefined) {
        this.parentScope = parentScope
        this.variables = {}
    }

    setVariable(variable) {
        /*
        Sets the given variable in the appropriate scope.
        */

        // Get existing variable (in any scope)
        let currentVariable = this.resolveVariable(variable)

        // Overwrite variable if it already exists
        if (currentVariable !== undefined) {
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
}
