export class EncapsulatedScope {

    constructor() {
        this.scopes = []
        this.pushScope()
    }

    pushScope() {
        const scope = new Scope()
        this.scopes.push(scope)
        return scope
    }

    popScope() {
        return this.scopes.pop()
    }

    currentScope() {
        return this.scopes[this.scopes.length - 1]
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
            this.currentScope().setVariable(variable)
        }
    }

    resolveVariable(name) {
        /*
        Resolves a variable with the given name in the current scope.
        */

        // Run backwards through local scopes
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i]
            const variable = scope.resolveVariable(name)
            if (variable !== undefined) {
                return variable
            }
        }

        // Not found
        return undefined
    }
}

export class Scope {

    constructor() {
        this.variables = {}
    }

    setVariable(variable) {
        this.variables[variable.name] = variable
    }

    resolveVariable(name) {
        return name in this.variables ? this.variables[name] : undefined
    }
}
