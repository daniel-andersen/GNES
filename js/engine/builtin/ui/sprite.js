import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import { Scope } from '../../model/scope'
import Util from '../../util/util'

export class Sprite {
    static *initialize(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')
        objectScope.spriteMeta = {
            left: 0,
            top: 0,
            right: 64,
            bottom: 64,
            center: {
                x: 32,
                y: 32
            }
        }
    }

    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        // Update visibility
        sprite.visible = Builtin.resolveVariable(scope, 'visible').value()

        // Update position
        Sprite.updatePosition(scope)
    }

    static *load(scope) {

        // Resolve filename
        const filenameConstant = Builtin.resolveParameter(scope, 'filename')
        if (filenameConstant === undefined) {
            throw new Error('"filename" not given as parameter.')
        }
        const filename = filenameConstant.value()

        // Resolve layer
        const layerIndex = Builtin.resolveParameter(scope, 'layer').value()

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
        objectScope.sprite = Builtin.scene().add.sprite(0, 0, imageName)
        objectScope.sprite.visible = false

        // Add to default group
        const world = Builtin.resolveClass(objectScope, 'World')
        const tilemapObjectInstance = Builtin.resolveVariable(world.sharedScope, 'tilemap').value()
        if (tilemapObjectInstance !== undefined && tilemapObjectInstance.type === Constant.Type.ObjectInstance) {
            const spriteLayer = tilemapObjectInstance.scope.spriteLayers[Math.min(layerIndex, tilemapObjectInstance.scope.spriteLayers.length - 1)]
            spriteLayer.add(objectScope.sprite)
        }
        else {
            Builtin.group(Builtin.Group.default).add(objectScope.sprite)
        }

        // Update size
        objectScope.setVariable('width', new Constant(objectScope.sprite.width))
        objectScope.setVariable('height', new Constant(objectScope.sprite.height))
    }

    static *show(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        scope.setVariable('visible', new Constant(true))
    }

    static *hide(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        scope.setVariable('visible', new Constant(false))
    }

    static *move(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const sprite = objectScope.sprite
        if (sprite === undefined) {
            return
        }

        // Resolve x coordinate
        const xConstant = Builtin.resolveParameter(scope, 'x')
        if (xConstant === undefined) {
            throw new Error('"x" not given as parameter.')
        }
        const x = xConstant.value()

        // Resolve y coordinate
        const yConstant = Builtin.resolveParameter(scope, 'y')
        if (yConstant === undefined) {
            throw new Error('"y" not given as parameter.')
        }
        const y = yConstant.value()

        // Resolve time
        const timeConstant = Builtin.resolveParameter(scope, 'time')
        const time = timeConstant !== undefined ? timeConstant.value() : undefined

        // Animate move
        if (time > 0) {
            const startTime = Util.currentTime()
            const endTime = startTime + time

            const startPosition = {
                x: Builtin.resolveVariable(objectScope, 'x').value(),
                y: Builtin.resolveVariable(objectScope, 'y').value()
            }

            while (Util.currentTime() < endTime) {

                // Move to delta position
                const delta = (Util.currentTime() - startTime) / (endTime - startTime)

                objectScope.setVariable('x', new Constant(startPosition.x + ((x - startPosition.x) * delta)))
                objectScope.setVariable('y', new Constant(startPosition.y + ((y - startPosition.y) * delta)))

                Sprite.updatePosition(objectScope)

                // Register update callback
                let ready = false
                scope.resolveScope(Scope.Type.Global).onUpdateCallbacks.push(() => {
                    ready = true
                })

                // Wait for update callback
                while (!ready) {
                    yield
                }
            }
        }

        // Move to final position
        objectScope.setVariable('x', new Constant(x))
        objectScope.setVariable('y', new Constant(y))

        Sprite.updatePosition(objectScope)
    }

    static updatePosition(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'Sprite')
        const sprite = objectScope.sprite

        // Get anchor
        const anchor = Builtin.resolveVariable(scope, 'anchor').value()
        const anchorX = Builtin.resolveVariable(anchor.scope, 'x').value()
        const anchorY = Builtin.resolveVariable(anchor.scope, 'y').value()

        // Get width and height
        const width = Builtin.resolveVariable(scope, 'width').value()
        const height = Builtin.resolveVariable(scope, 'height').value()

        // Update sprite according to variables
        sprite.x = Builtin.resolveVariable(scope, 'x').value() - ((anchorX - 0.5) * width)
        sprite.y = Builtin.resolveVariable(scope, 'y').value() - ((anchorY - 0.5) * height)

        // Update borders
        objectScope.spriteMeta.left = sprite.x - (width / 2)
        objectScope.spriteMeta.top = sprite.y - (height / 2)
        objectScope.spriteMeta.right = objectScope.spriteMeta.left + width - 1
        objectScope.spriteMeta.bottom = objectScope.spriteMeta.top + height - 1
        objectScope.spriteMeta.center = {
            x: (objectScope.spriteMeta.left + objectScope.spriteMeta.right) / 2,
            y: (objectScope.spriteMeta.top + objectScope.spriteMeta.bottom) / 2,
        }
    }
}
