import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Screen {
    static *initialize(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        classScope.screen = {
            width: document.getElementById('gnes').offsetWidth,
            height: document.getElementById('gnes').offsetHeight,
        }

        // Set width and height
        scope.setVariable(new Variable('width', new Constant(classScope.screen.width)))
        scope.setVariable(new Variable('height', new Constant(classScope.screen.height)))
    }

    static *update(scope) {
        const classScope = Builtin.resolveClassScope(scope)

        this.updateFps(scope, classScope)
    }

    static updateFps(scope, classScope) {
        if (classScope.screen.fpsStartTime === undefined) {
            classScope.screen.fpsStartTime = Util.currentTimeMillis()
            classScope.screen.fpsCount = 0
        }

        // Increase fps counter
        classScope.screen.fpsCount += 1

        // Get current time
        const time = Util.currentTimeMillis()

        // If more than a second and a epsilon has ellapsed, things have been paused, so reset
        if (time - classScope.screen.fpsStartTime >= 1100) {
            classScope.screen.fpsStartTime = Util.currentTimeMillis()
            classScope.screen.fpsCount = 0
        }

        // Check if a second has ellapsed
        if (time - classScope.screen.fpsStartTime >= 1000) {

            // Set fps
            const fps = Math.max(1, classScope.screen.fpsCount)
            scope.setVariable(new Variable('fps', new Constant(fps)))

            // Set frameSpeed
            const frameSpeed = 60.0 / fps
            scope.setVariable(new Variable('frameSpeed', new Constant(frameSpeed)))

            // Log fps
            console.log('FPS:', fps, 'frameSpeed:', frameSpeed)

            // Reset fps
            classScope.screen.fpsStartTime += 1000
            classScope.screen.fpsCount = 0
        }
    }
}
