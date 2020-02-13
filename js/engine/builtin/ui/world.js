import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class World {
    static *initialize(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        // Set width and height
        scope.setVariable('width', new Constant(Builtin.config().size.width))
        scope.setVariable('height', new Constant(Builtin.config().size.height))
    }
}
