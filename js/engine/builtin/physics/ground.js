import * as Phaser from 'phaser'
import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'
import { Sprite } from '../ui/sprite'

export class Ground {
    static *update(scope) {

        // Check if tile collection or pixel collision
        if (true) {
            yield
            yield *Ground.tileCollision(scope)
        }
        else {
            yield
            yield *Ground.pixelCollision(scope)
        }
    }

    static *tileCollision(scope) {

        // Number of steps a tile is divided into
        const tileStepGranularity = 8

        // Resolve variables
        const objectScope = Builtin.resolveObjectScope(scope, 'Ground')
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

        const position = {
            x: Builtin.resolveVariable(scope, 'x').value(),
            y: Builtin.resolveVariable(scope, 'y').value()
        }

        const movement = Builtin.resolveVariable(objectScope, 'movement').value()
        const velocityObjectInstance = Builtin.resolveVariable(movement.scope, 'velocity').value()
        const velocity = {
            x: Builtin.resolveVariable(velocityObjectInstance.scope, 'x').value(),
            y: Builtin.resolveVariable(velocityObjectInstance.scope, 'y').value()
        }

        // Get tile layer
        const layer = Ground.getLayer(scope, tilemapObjectInstance)

        // Get step size
        const tileSize = {width: layer.tileToWorldX(1) - layer.tileToWorldX(0), height: layer.tileToWorldY(1) - layer.tileToWorldY(0)}

        const stepSizePerTile = {
            x: tileSize.width / tileStepGranularity,
            y: tileSize.height / tileStepGranularity
        }

        const stepSize = {
            x: stepSizePerTile.x * (spriteSize.width + (Math.round(spriteSize.width) % Math.round(tileSize.width))) / (spriteSize.width - 2),
            y: stepSizePerTile.y * (spriteSize.height + (Math.round(spriteSize.height) % Math.round(tileSize.height))) / (spriteSize.height - 2)
        }

        // Project position in time
        const targetPosition = {
            x: position.x + (velocity.x * frameSpeed),
            y: position.y + (velocity.y * frameSpeed)
        }

        const delta = {
            x: targetPosition.x - position.x,
            y: targetPosition.y - position.y
        }

        const targetDistance = Math.sqrt(delta.x*delta.x + delta.y*delta.y)

        // Project lines from current position border edge to target position border edge
        let border = {
            x: delta.x < 0 ? (spriteScope.spriteMeta.left - 1) : (spriteScope.spriteMeta.right + 1),
            y: delta.y < 0 ? (spriteScope.spriteMeta.top - 1) : (spriteScope.spriteMeta.bottom + 1)
        }

        let projectedLines = []

        for (let y = spriteScope.spriteMeta.top + 1; y <= spriteScope.spriteMeta.bottom; y += stepSize.y) {
            projectedLines.push({startX: border.x, startY: y, endX: border.x + delta.x, endY: y + delta.y})
        }

        for (let x = spriteScope.spriteMeta.left + 1; x <= spriteScope.spriteMeta.right; x += stepSize.x) {
            projectedLines.push({startX: x, startY: border.y, endX: x + delta.x, endY: border.y + delta.y})
        }

        // Get first collision tile
        const closestCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

        // Check if any collision
        if (closestCollision === undefined) {
            return
        }

        // Position sprite at collision point
        const firstCollisionPosition = {
            x: Math.round(position.x + (delta.x * closestCollision.distance / targetDistance)),
            y: Math.round(position.y + (delta.y * closestCollision.distance / targetDistance))
        }

        objectScope.setVariable('x', new Constant(firstCollisionPosition.x))
        objectScope.setVariable('y', new Constant(firstCollisionPosition.y))

        // Update sprite position
        Sprite.updatePosition(spriteScope)

        // Calculate remaining velocity
        const remainingDelta = {
            x: targetPosition.x - firstCollisionPosition.x,
            y: targetPosition.y - firstCollisionPosition.y
        }

        border = {
            x: delta.x < 0 ? (spriteScope.spriteMeta.left - 1) : (spriteScope.spriteMeta.right + 1),
            y: delta.y < 0 ? (spriteScope.spriteMeta.top - 1) : (spriteScope.spriteMeta.bottom + 1)
        }

        // Check if it was a horizontal or vertical collision (or both)
        projectedLines = []
        projectedLines.push({startX: border.x, startY: spriteScope.spriteMeta.top + 1, endX: border.x, endY: spriteScope.spriteMeta.bottom - 1})
        let horizontalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

        projectedLines = []
        projectedLines.push({startX: spriteScope.spriteMeta.left + 1, startY: border.y, endX: spriteScope.spriteMeta.right - 1, endY: border.y})
        let verticalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

        // Stop moving horizontally
        if (horizontalCollision !== undefined) {
            velocityObjectInstance.scope.setVariable('x', new Constant(0))
        }

        // Move remaining horizontal velocity
        else {

            // Get collision horizontally away from first collision point
            projectedLines = []
            for (let y = spriteScope.spriteMeta.top + 1; y < spriteScope.spriteMeta.bottom; y += stepSize.y) {
                projectedLines.push({startX: border.x, startY: y, endX: border.x + remainingDelta.x, endY: y})
            }
            horizontalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

            // Move remaining horizontal velocity
            if (horizontalCollision !== undefined) {
                objectScope.setVariable('x', new Constant(firstCollisionPosition.x + horizontalCollision.x - border.x))
                velocityObjectInstance.scope.setVariable('x', new Constant(0))
            }

            // Revert to original position and velocity
            else {
                objectScope.setVariable('x', new Constant(position.x))
            }
        }

        // Stop moving vertically
        if (verticalCollision !== undefined) {
            velocityObjectInstance.scope.setVariable('y', new Constant(0))
        }

        // Move remaining vertical velocity
        else {

            // Get collision vertically away from first collision point
            projectedLines = []
            for (let x = spriteScope.spriteMeta.left + 1; x < spriteScope.spriteMeta.right; x += stepSize.x) {
                projectedLines.push({startX: x, startY: border.y, endX: x, endY: border.y + remainingDelta.y})
            }
            verticalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

            // Move remaining vertical velocity
            if (verticalCollision !== undefined) {
                objectScope.setVariable('y', new Constant(firstCollisionPosition.y + verticalCollision.y - border.y))
                velocityObjectInstance.scope.setVariable('y', new Constant(0))
            }

            // Revert to original position and velocity
            else {
                objectScope.setVariable('y', new Constant(position.y))
            }
        }

        // Update sprite position
        Sprite.updatePosition(spriteScope)
    }

    static *pixelCollision(scope) {
    }

    static getLayer(scope, tilemapObjectInstance) {
        const layerIndex = Builtin.resolveVariable(scope, 'layer').value()
        return tilemapObjectInstance.scope.layers[layerIndex]
    }

    static getCollisionPoint(lines, tilemap, layer) {

        // Get first collision
        let closestCollision = undefined

        for (let line of lines) {
            const {tile, x, y} = Ground.getFirstTileOnLine(line, tilemap, layer)
            if (tile === undefined) {
                continue
            }

            const distance = Math.sqrt((x - line.startX) * (x - line.startX) + (y - line.startY) * (y - line.startY))
            if (closestCollision === undefined || distance < closestCollision.distance) {
                closestCollision = {x, y, tile, distance}
            }
        }

        return closestCollision
    }

    static getFirstTileOnLine(line, tilemap, layer) {
        const _line = new Phaser.Curves.Line(
            new Phaser.Math.Vector2(Math.round(line.startX), Math.round(line.startY)),
            new Phaser.Math.Vector2(Math.round(line.endX), Math.round(line.endY))
        )
        const points = _line.getPoints(0, 1)

        let currentTilePosition = new Phaser.Math.Vector2(-1, -1)

        for (let point of points) {
            const x = Math.round(point.x)
            const y = Math.round(point.y)

            const tileCoordinate = layer.worldToTileXY(x, y)
            if (tileCoordinate.x == currentTilePosition.x && tileCoordinate.y == currentTilePosition.y) {
                continue
            }

            currentTilePosition = tileCoordinate

            const tile = tilemap.getTileAt(tileCoordinate.x, tileCoordinate.y)
            if (tile !== undefined && tile !== null) {
                return {tile: tile, x: x, y: y}
            }
        }

        return {tile: undefined, x: undefined, y: undefined}
    }
}
