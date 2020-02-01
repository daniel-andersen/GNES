import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Sprite {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        sprite.x = scope.resolveVariable('x').value().value()
        sprite.y = scope.resolveVariable('y').value().value()
        sprite.visible = scope.resolveVariable('visible').value().value()
    }

    static *load(scope) {

        // Resolve filename
        const filenameConstant = Builtin.resolveParameter(scope, 'filename')
        if (filenameConstant === undefined) {
            throw new Error('"Filename" not given as parameter.')
        }
        const filename = filenameConstant.value()

        // Resolve object scope
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')
        if (objectScope === undefined) {
            throw new Error('Native "Sprite.Load" can only be called from Sprite class.')
        }

        // Load image
        console.log('Loading sprite with filename', Builtin.resolveParameter(scope, 'filename').value())

        const imageName = Util.uuid()
        let success = true
        let complete = false

        Builtin.scene().load.image(imageName, filename)
        Builtin.scene().load.once('complete', () => {
            complete = true
        })
        Builtin.scene().load.once('loaderror', () => {
            success = false
        })
        Builtin.scene().load.start()

        // Wait for image to load
        while (!complete) {
            yield
        }

        // Error
        if (!success) {
            throw new Error('Could not load image "' + filename + '"')
        }

        // Add sprite
        objectScope.sprite = Builtin.scene().add.sprite(100, 100, imageName)
        objectScope.sprite.visible = false

        // Add to default group
        Builtin.group(Builtin.Group.default).add(objectScope.sprite)
    }

    static *show(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        scope.setVariable(new Variable('visible', new Constant(true)))
    }

    static *hide(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        scope.setVariable(new Variable('visible', new Constant(false)))
    }
}
