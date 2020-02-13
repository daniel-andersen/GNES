import { Scope } from '../model/scope'
import Util from '../util/util'

export class Builtin {
    static scene() {
        return window.game.phaser.scene
    }

    static config() {
        return window.game.phaser.config
    }

    static group(type) {
        return window.game.phaser.groups[type]
    }

    static resolveParameter(scope, name) {
        const variable = scope.resolveVariableInOwnScope(name)
        return variable !== undefined ? variable.value : undefined
    }

    static resolveVariable(scope, name) {
        const variable = scope.resolveVariable(name)
        return variable !== undefined ? variable.value : undefined
    }

    static resolveFunction(scope, name) {
        return scope.resolveFunction(name)
    }

    static resolveClass(scope, name) {
        return scope.resolveClass(name)
    }

    static resolveVariableScope(scope, name) {
        return scope.resolveVariableScope(name)
    }

    static resolveFunctionScope(scope) {
        return scope.resolveScope(Scope.Type.Function)
    }

    static resolveObjectScope(scope, className=undefined) {
        if (className !== undefined) {
            return scope.resolveObjectScopeWithClassName(className)
        }
        else {
            return scope.resolveScope(Scope.Type.Object)
        }
    }

    static resolveClassScope(scope) {
        return scope.resolveScope(Scope.Type.Class)
    }

    static resolveFileScope(scope) {
        return scope.resolveScope(Scope.Type.File)
    }

    static resolveGlobalScope(scope) {
        return scope.resolveScope(Scope.Type.Global)
    }

    static *loadJson(filename) {
        let complete = false

        // Load json
        let json = undefined
        try {
            Util.readJsonFile(filename).then((_json) => {
                json = _json
                complete = true
            })
        } catch (e) {
            throw new Error(e)
        }

        // Wait until completed
        while (!complete) {
            yield
        }

        return json
    }
}

Builtin.Group = {
    default: 'default',
    sprites: 'sprites',
    enemies: 'enemies',
    loot: 'loot',
}
