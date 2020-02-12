import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Camera {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Camera')

        // Update camera position
        const spriteX = scope.resolveVariable('x').value().value()
        const spriteY = scope.resolveVariable('y').value().value()

        const screenWidth = Builtin.config().size.width
        const screenHeight = Builtin.config().size.height

        const centerVectorConstant = Builtin.resolveVariable(scope, 'center')
        const centerX = Builtin.resolveVariable(centerVectorConstant.value().scope, 'x').value()
        const centerY = Builtin.resolveVariable(centerVectorConstant.value().scope, 'y').value()

        Builtin.scene().cameras.main.setScroll(
            spriteX - (screenWidth * centerX),
            spriteY - (screenHeight * centerY)
        )
    }
}
