import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class TileMovement {
    static *initialize(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        objectScope.state = {
            diagonalAllowed: true,
            lastMoveTime: 0,
            moves: {
                left: false,
                right: false,
                up: false,
                down: false
            }
        }
    }

    static *moveLeft(scope) {
        TileMovement.prepareMove(scope, 'left')
    }

    static *moveRight(scope) {
        TileMovement.prepareMove(scope, 'right')
    }

    static *moveUp(scope) {
        TileMovement.prepareMove(scope, 'up')
    }

    static *moveDown(scope) {
        TileMovement.prepareMove(scope, 'down')
    }

    static *update(scope) {

        // Check time
        if (!TileMovement.readyToMove(scope)) {
            return
        }

        // Move
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        if (objectScope.state.moves.left) {
            TileMovement.move(scope, 'x', -1)
            objectScope.state.moves.left = false
        }
        if (objectScope.state.moves.right) {
            TileMovement.move(scope, 'x', 1)
            objectScope.state.moves.right = false
        }
        if (objectScope.state.moves.up) {
            TileMovement.move(scope, 'y', -1)
            objectScope.state.moves.up = false
        }
        if (objectScope.state.moves.down) {
            TileMovement.move(scope, 'y', 1)
            objectScope.state.moves.down = false
        }
    }

    static move(scope, variableName, direction) {

        // Move
        const currentValue = Builtin.resolveVariable(scope, variableName).value()

        const stepVector = Builtin.resolveVariable(scope, 'step').value()
        const stepKey = Builtin.resolveVariable(stepVectorConstant.scope, variableName).value()

        scope.setVariable(variableName, new Constant(currentValue + (stepKey * direction)))

        // Update last move time
        TileMovement.updateMoveTime(scope)
    }

    static prepareMove(scope, direction) {

        // Check time
        if (!TileMovement.canPrepareMove(scope)) {
            return
        }

        // Only move diagonally if allowed
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        if (!objectScope.state.diagonalAllowed) {
            if (objectScope.state.moves.left || objectScope.state.moves.right || objectScope.state.moves.up || objectScope.state.moves.down) {
                return
            }
        }

        // Prepare move
        objectScope.state.moves[direction] = true
    }

    static readyToMove(scope, variableName) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        const timeSinceLastMove = Util.currentTimeMillis() - objectScope.state.lastMoveTime

        const delay = Builtin.resolveVariable(scope, 'delay').value()

        return timeSinceLastMove >= delay * 1000
    }

    static canPrepareMove(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        const timeSinceLastMove = Util.currentTimeMillis() - objectScope.state.lastMoveTime

        const delay = Builtin.resolveVariable(scope, 'delay').value()

        return timeSinceLastMove >= (delay * 1000) * 3 / 5
    }

    static updateMoveTime(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileMovement')
        objectScope.state.lastMoveTime = Util.currentTimeMillis()
    }
}
