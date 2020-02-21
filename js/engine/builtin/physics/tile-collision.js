import * as Phaser from 'phaser'
import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'
import { Sprite } from '../ui/sprite'

export class TileCollision {
    static *update(scope) {
        const objectScope = Builtin.resolveObjectScope(scope, 'TileCollision')
        TileCollision.tileCollision(scope)
    }

    static tileCollision(scope) {

        // Resolve variables
        const objectScope = Builtin.resolveObjectScope(scope, 'TileCollision')
        const spriteScope = Builtin.resolveObjectScope(scope, 'Sprite')

        const world = Builtin.resolveClass(objectScope, 'World')
        const tilemapObjectInstance = Builtin.resolveVariable(world.sharedScope, 'tilemap').value()
        const tilemap = tilemapObjectInstance.scope.tilemap

        const screen = Builtin.resolveClass(objectScope, 'Screen')
        const frameSpeed = Builtin.resolveVariable(screen.sharedScope, 'frameSpeed').value()

        const spriteSize = {
            width: Builtin.resolveVariable(scope, 'width').value(),
            height: Builtin.resolveVariable(scope, 'height').value()
        }

        const moveable = Builtin.resolveVariable(objectScope, 'moveable').value()
        const velocityObjectInstance = Builtin.resolveVariable(moveable.scope, 'velocity').value()

        // Get collision action
        const action = Builtin.resolveVariable(objectScope, 'action').value()
        const bounceHorizontal = action == 'bounce' || action == 'bounceHorizontal'
        const bounceVertical = action == 'bounce' || action == 'bounceVertical'

        const gravity = Builtin.resolveVariable(objectScope, 'gravity').value()
        const gravityBounce = gravity !== undefined && gravity.type != Constant.Type.None

        // Get tile layer
        const layer = TileCollision.getLayer(scope, tilemapObjectInstance)

        // Get step size
        const tileSize = {width: layer.tileToWorldX(1) - layer.tileToWorldX(0), height: layer.tileToWorldY(1) - layer.tileToWorldY(0)}

        // Get initial values
        let position = {
            x: Builtin.resolveVariable(scope, 'x').value(),
            y: Builtin.resolveVariable(scope, 'y').value()
        }

        let velocity = {
            x: Builtin.resolveVariable(velocityObjectInstance.scope, 'x').value(),
            y: Builtin.resolveVariable(velocityObjectInstance.scope, 'y').value()
        }

        // Calculate target
        let targetPosition = {
            x: position.x + (velocity.x * frameSpeed),
            y: position.y + (velocity.y * frameSpeed)
        }

        let delta = {
            x: targetPosition.x - position.x,
            y: targetPosition.y - position.y
        }

        // Initial values
        const initialPosition = {
            x: position.x,
            y: position.y
        }

        const initialDelta = {
            x: delta.x,
            y: delta.y
        }

        // Define output
        let outputPosition = {
            x: position.x,
            y: position.y
        }

        let outputVelocity = {
            x: velocity.x,
            y: velocity.y
        }

        // Check collision in two steps (because sprite might have "glide" enabled, etc.)
        for (let i = 0; i < 2; i++) {

            // Calculate target position in current direction
            targetPosition = {
                x: position.x + delta.x,
                y: position.y + delta.y
            }

            const collision = this.getCollisionInDirection(spriteScope.spriteMeta, delta, tileSize, tilemap, layer)
            if (collision === undefined) {
                break
            }

            // Position sprite at collision point
            position = {
                x: position.x + Math.round(collision.delta.x),
                y: position.y + Math.round(collision.delta.y)
            }

            objectScope.setVariable('x', new Constant(position.x))
            objectScope.setVariable('y', new Constant(position.y))

            // Update sprite position
            Sprite.updatePosition(spriteScope)

            // Calculate remaining velocity
            delta = {
                x: targetPosition.x - position.x,
                y: targetPosition.y - position.y
            }

            // Horizontal collision
            if (collision.horizontal) {

                // Bounce
                if (bounceHorizontal) {
                    outputVelocity.x = Math.abs(outputVelocity.x) * -Math.sign(delta.x)
                    outputPosition.x = position.x - (outputVelocity.x * frameSpeed)
                }

                // No bounce
                else {
                    outputPosition.x = position.x
                    outputVelocity.x = 0.0
                }

                delta.x = 0.0
            }

            // Vertical collision
            if (collision.vertical) {

                // Bounce (if bouncing or if bumping into something above with gravity enabled)
                if (bounceVertical || (delta.y < 0.0 && gravityBounce)) {
                    outputVelocity.y = Math.abs(outputVelocity.y) * -Math.sign(delta.y)
                    outputPosition.y = position.y - (outputVelocity.y * frameSpeed)
                }

                // No bounce
                else {
                    outputVelocity.y = 0.0
                    outputPosition.y = position.y
                }

                delta.y = 0.0
            }
        }

        // Position sprite at collision point
        objectScope.setVariable('x', new Constant(Math.round(outputPosition.x)))
        objectScope.setVariable('y', new Constant(Math.round(outputPosition.y)))

        // Set velocity
        velocityObjectInstance.scope.setVariable('x', new Constant(outputVelocity.x))
        velocityObjectInstance.scope.setVariable('y', new Constant(outputVelocity.y))

        // Update sprite position
        Sprite.updatePosition(spriteScope)
    }

    static getLayer(scope, tilemapObjectInstance) {
        const layerIndex = Builtin.resolveVariable(scope, 'layer').value()
        return tilemapObjectInstance.scope.layers[layerIndex]
    }

    static getCollisionInDirection(spriteMeta, delta, tileSize, tilemap, layer) {
        const border = {
            x: delta.x < 0 ? (spriteMeta.left - 1) : (spriteMeta.right + 1),
            y: delta.y < 0 ? (spriteMeta.top - 1) : (spriteMeta.bottom + 1)
        }

        const startX = Math.round(border.x)
        const startY = Math.round(border.y)

        // Vertical collision
        let verticalCollision = undefined

        let y = startY
        let targetY = Math.round(border.y + delta.y)

        while ((y <= targetY && delta.y > 0) || (y >= targetY && delta.y < 0)) {

            // Get coordinate of tile strip
            const slope = delta.x * ((y - startY) / (targetY - startY))

            const tileCoordinateX1 = layer.worldToTileXY(Math.round(spriteMeta.left + 1 + slope), y)
            const tileCoordinateX2 = layer.worldToTileXY(Math.round(spriteMeta.right - 1 + slope), y)

            const distance = Math.sqrt((y - startY) * (y - startY) + slope * slope)

            // Check collision in strip
            for (let tileX = tileCoordinateX1.x; tileX <= tileCoordinateX2.x; tileX++) {
                const tile = tilemap.getTileAt(tileX, tileCoordinateX1.y, false, layer)
                if (tile !== undefined && tile !== null) {
                    verticalCollision = {tile: tile, horizontal: false, vertical: true, distance: distance, delta: {x: slope, y: y - startY - Math.sign(delta.y)}}
                }
            }
            if (verticalCollision !== undefined) {
                break
            }

            // Move vertically away from sprite, interchangible between top and bottom edge of tile
            const tileWorldY = layer.tileToWorldY(tileCoordinateX1.y)
            if (Math.abs(y - tileWorldY) < (tileSize.height / 2)) { // Edge of current tile
                y = tileWorldY + (delta.y > 0 ? (tileSize.height - 1) : -1)
            }
            else { // Edge of next tile
                y = tileWorldY + (tileSize.height * Math.sign(delta.y))
            }
        }

        // Horizontal collision
        let horizontalCollision = undefined

        let x = startX
        let targetX = Math.round(border.x + delta.x)

        while ((x <= targetX && delta.x > 0) || (x >= targetX && delta.x < 0)) {

            // Get coordinate of tile strip
            const slope = delta.y * ((x - startX) / (targetX - startX))

            const tileCoordinateY1 = layer.worldToTileXY(x, Math.round(spriteMeta.top + 1 + slope))
            const tileCoordinateY2 = layer.worldToTileXY(x, Math.round(spriteMeta.bottom - 1 + slope))

            const distance = Math.sqrt((x - startX) * (x - startX) + slope * slope)

            // Check collision in strip
            for (let tileY = tileCoordinateY1.y; tileY <= tileCoordinateY2.y; tileY++) {
                const tile = tilemap.getTileAt(tileCoordinateY1.x, tileY, false, layer)
                if (tile !== undefined && tile !== null) {
                    horizontalCollision = {tile: tile, horizontal: true, vertical: false, distance: distance, delta: {x: x - startX - Math.sign(delta.x), y: slope}}
                }
            }
            if (horizontalCollision !== undefined) {
                break
            }

            // Move horizontal away from sprite, interchangible between left and right edge of tile
            const tileWorldX = layer.tileToWorldX(tileCoordinateY1.x)
            if (Math.abs(x - tileWorldX) < (tileSize.width / 2)) { // Edge of current tile
                x = tileWorldX + (delta.x > 0 ? (tileSize.width - 1) : -1)
            }
            else { // Edge of next tile
                x = tileWorldX + (tileSize.width * Math.sign(delta.x))
            }
        }

        // Return closest collision
        if (horizontalCollision !== undefined && verticalCollision !== undefined) {
            if (horizontalCollision.distance < verticalCollision.distance) {
                return horizontalCollision
            }
            else {
                return verticalCollision
            }
        }
        else if (horizontalCollision !== undefined) {
            return horizontalCollision
        }
        else if (verticalCollision !== undefined) {
            return verticalCollision
        }
        else {
            return undefined
        }
    }
}
