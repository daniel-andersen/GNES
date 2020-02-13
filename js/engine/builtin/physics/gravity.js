import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'

export class Gravity {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Gravity')

        const drag = Builtin.resolveVariable(objectScope, 'drag').value()

        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const movement = Builtin.resolveVariable(objectScope, 'movement').value()
        const velocity = Builtin.resolveVariable(movement.scope, 'velocity').value()
        const y = Builtin.resolveVariable(velocity.scope, 'y').value()

        velocity.scope.setVariable('y', new Constant(y + (drag * frameSpeed / 10.0)))
    }
}
