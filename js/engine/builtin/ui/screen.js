import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Screen {
    static *initialize(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        // Set width and height
        scope.setVariable(new Variable('width', new Constant(window.innerWidth)))
        scope.setVariable(new Variable('height', new Constant(window.innerHeight)))
    }

    static *update(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        this.updateFps(scope, classScope)
    }

    static updateFps(scope, classScope) {
        if (classScope.fpsStartTime === undefined) {
            classScope.fpsStartTime = Util.currentTimeMillis()
            classScope.fpsCount = 0
        }

        const time = Util.currentTimeMillis()

        if (time - classScope.fpsStartTime >= 1000) {

            // Set fps
            const fps = (time - classScope.fpsStartTime) / Math.max(1.0, classScope.fpsCount)
            scope.setVariable(new Variable('fps', new Constant(fps)))

            // Set frameSpeed
            const frameSpeed = 30.0 / fps
            scope.setVariable(new Variable('frameSpeed', new Constant(frameSpeed)))

            // Log fps
            console.log('FPS:', fps, 'frameSpeed:', frameSpeed)

            // Reset fps
            classScope.fpsStartTime += 1000
            classScope.fpsCount = 0
        }

        // Increase fps counter
        classScope.fpsCount += 1
    }
}
