import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Array {
    static *count(scope) {

        // Resolve object scope
        const objectScope = Builtin.resolveObjectScope(scope, 'Array')
        if (objectScope === undefined) {
            throw new Error('Native "Array.Count" can only be called from Array class.')
        }

        // Return length
        return new Constant(objectScope.entries.length)
    }
}
