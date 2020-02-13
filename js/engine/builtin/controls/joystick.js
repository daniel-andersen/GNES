import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Joystick {
    static *initialize(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        // Add arrow keys
        classScope.keys = {
            left: Builtin.scene().input.keyboard.addKey('left'),
            right: Builtin.scene().input.keyboard.addKey('right'),
            up: Builtin.scene().input.keyboard.addKey('up'),
            down: Builtin.scene().input.keyboard.addKey('down')
        }
    }

    static *update(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        scope.setVariable('left', new Constant(classScope.keys.left.isDown))
        scope.setVariable('right', new Constant(classScope.keys.right.isDown))
        scope.setVariable('up', new Constant(classScope.keys.up.isDown))
        scope.setVariable('down', new Constant(classScope.keys.down.isDown))
    }
}
