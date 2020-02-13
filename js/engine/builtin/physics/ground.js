import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'

export class Ground {
    static *update(scope) {

        // Resolve variables
        const objectScope = Builtin.resolveObjectScope(scope, 'Ground')

        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const positionX = Builtin.resolveVariable(scope, 'x').value()
        const positionY = Builtin.resolveVariable(scope, 'y').value()

        const movement = Builtin.resolveVariable(objectScope, 'movement').value()
        const velocity = Builtin.resolveVariable(movement.scope, 'velocity').value()
        const velocityX = Builtin.resolveVariable(velocity.scope, 'x').value()
        const velocityY = Builtin.resolveVariable(velocity.scope, 'y').value()

        // Project position in time
        const targetPositionX = positionX + (velocityX * frameSpeed)
        const targetPositionY = positionY + (velocityY * frameSpeed)

        // Check vertically
        const verticallyBlocked = Ground.checkVertically(scope, positionX, positionY)
    }

    static checkVertically(scope, positionX, positionY, targetPositionX, targetPositionY) {

    }
}
