import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class TileMovement {
    static *initialize(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        objectScope.state = {
            targetPosition: {
                x: undefined,
                y: undefined
            },
            diagonalAllowed: false,
            canMove: {
                x: true,
                y: true
            }
        }
    }

    static *moveLeft(scope) {
        TileMovement.move(scope, 'x', -1)
    }

    static *moveRight(scope) {
        TileMovement.move(scope, 'x', 1)
    }

    static *moveUp(scope) {
        TileMovement.move(scope, 'y', -1)
    }

    static *moveDown(scope) {
        TileMovement.move(scope, 'y', 1)
    }

    static *postUpdate(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')

        // Update velocity
        const stepObject = Builtin.resolveVariable(scope, 'step').value()
        const step = {
            x: Builtin.resolveVariable(stepObject.scope, 'x').value(),
            y: Builtin.resolveVariable(stepObject.scope, 'y').value()
        }

        const velocityObject = Builtin.resolveVariable(objectScope, 'velocity').value()

        const velocity = {
            x: Builtin.resolveVariable(velocityObject.scope, 'x').value(),
            y: Builtin.resolveVariable(velocityObject.scope, 'y').value()
        }

        // Calculate target position
        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const position = {
            x: Builtin.resolveVariable(objectScope, 'x').value(),
            y: Builtin.resolveVariable(objectScope, 'y').value()
        }

        const finalPosition = {
            x: position.x + (velocity.x * frameSpeed),
            y: position.y + (velocity.y * frameSpeed)
        }

        // Stop movement
        let stopHorizontally = false
        stopHorizontally |= velocity.x > 0 && objectScope.state.targetPosition.x !== undefined && finalPosition.x >= objectScope.state.targetPosition.x
        stopHorizontally |= velocity.x < 0 && objectScope.state.targetPosition.x !== undefined && finalPosition.x <= objectScope.state.targetPosition.x
        if (stopHorizontally) {
            finalPosition.x = objectScope.state.targetPosition.x
            velocityObject.scope.setVariable('x', new Constant(0))
        }

        let stopVertically = false
        stopVertically |= velocity.y > 0 && objectScope.state.targetPosition.y !== undefined && finalPosition.y >= objectScope.state.targetPosition.y
        stopVertically |= velocity.y < 0 && objectScope.state.targetPosition.y !== undefined && finalPosition.y <= objectScope.state.targetPosition.y
        if (stopVertically) {
            finalPosition.y = objectScope.state.targetPosition.y
            velocityObject.scope.setVariable('y', new Constant(0))
        }

        // Set new position
        objectScope.setVariable('x', new Constant(finalPosition.x))
        objectScope.setVariable('y', new Constant(finalPosition.y))

        // Update can move state
        objectScope.state.canMove.x = this.canMove(scope, 'x')
        objectScope.state.canMove.y = this.canMove(scope, 'y')
    }

    static move(scope, variableName, direction) {

        // Check if we can move
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')

        if (!objectScope.state.canMove[variableName]) {
            return
        }

        // Set target
        const stepObject = Builtin.resolveVariable(scope, 'step').value()
        const step = {
            x: Builtin.resolveVariable(stepObject.scope, 'x').value(),
            y: Builtin.resolveVariable(stepObject.scope, 'y').value()
        }

        objectScope.state.targetPosition[variableName] = (Math.round(Builtin.resolveVariable(scope, variableName).value() / step[variableName]) + direction) * step[variableName]

        // Set velocity
        const speed = Builtin.resolveVariable(scope, 'speed').value()

        const velocityObject = Builtin.resolveVariable(scope, 'velocity').value()
        velocityObject.scope.setVariable(variableName, new Constant(speed * direction))

        // Prevent diagonal moves
        if (!objectScope.state.diagonalAllowed) {
            objectScope.state.canMove.x = false
            objectScope.state.canMove.y = false
        }
    }

    static canMove(scope, variableName) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')

        const velocityObject = Builtin.resolveVariable(scope, 'velocity').value()
        const velocity = {
            x: Builtin.resolveVariable(velocityObject.scope, 'x').value(),
            y: Builtin.resolveVariable(velocityObject.scope, 'y').value()
        }

        return velocity.x == 0 && velocity.y == 0
    }
}
