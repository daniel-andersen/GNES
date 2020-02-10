import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'

export class Gravity {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Gravity')

        const drag = Builtin.resolveVariable(objectScope, 'drag').value()

        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const moveable = Builtin.resolveVariable(objectScope, 'moveable').value()
        const velocity = Builtin.resolveVariable(moveable.scope, 'velocity').value()
        const y = Builtin.resolveVariable(velocity.scope, 'y').value()

        velocity.scope.setVariable(new Variable('y', new Constant(y + (drag * frameSpeed / 10.0))))
    }
}
