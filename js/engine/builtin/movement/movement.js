import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'

export class Movement {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Movement')

        // Update velocity
        const velocity = Builtin.resolveVariable(objectScope, 'velocity').value()
        const maxSpeed = Builtin.resolveVariable(objectScope, 'maxSpeed').value()

        const boundedVelocity = {
            x: Math.max(-maxSpeed, Math.min(maxSpeed, Builtin.resolveVariable(velocity.scope, 'x').value())),
            y: Math.max(-maxSpeed, Math.min(maxSpeed, Builtin.resolveVariable(velocity.scope, 'y').value()))
        }

        velocity.scope.setVariable('x', new Constant(boundedVelocity.x))
        velocity.scope.setVariable('y', new Constant(boundedVelocity.y))

        // Update position
        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const position = {
            x: Builtin.resolveVariable(objectScope, 'x').value(),
            y: Builtin.resolveVariable(objectScope, 'y').value()
        }

        objectScope.setVariable('x', new Constant(position.x + (boundedVelocity.x * frameSpeed)))
        objectScope.setVariable('y', new Constant(position.y + (boundedVelocity.y * frameSpeed)))
    }
}
