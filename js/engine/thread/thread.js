import { EncapsulatedScope } from '../model/scope'
import Util from '../util/util'

export class Thread {

    constructor() {
        this.uuid = Util.uuid()
        this.scopeStack = []

        // Push thread scope
        this.pushEncapsulatedScope()
    }

    pushLocalScope() {
        return this.currentEncapsulatedScope().pushScope()
    }

    popLocalScope() {
        return this.currentEncapsulatedScope().popScope()
    }

    currentLocalScope() {
        return this.currentEncapsulatedScope().currentScope()
    }

    pushEncapsulatedScope() {
        const scope = new EncapsulatedScope()
        this.scopeStack.push(scope)
        return scope
    }

    popEncapsulatedScope() {
        return this.scopeStack.pop()
    }

    currentEncapsulatedScope() {
        return this.scopeStack[this.scopeStack.length - 1]
    }

    setVariable(variable) {
        this.currentLocalScope().setVariable(variable)
    }

    resolveVariable(name) {
        /*
        Resolves a variable with the given name in the current thread.
        */

        // Resolve in current scope
        let variable = this.currentEncapsulatedScope().resolveVariable(name)
        if (variable !== undefined) {
            return variable
        }

        // Resolve in global scope
        variable = Game.sharedInstance.globals.scope.resolveVariable(name)
        if (variable !== undefined) {
            return variable
        }

        // Not found
        return undefined
    }
}
