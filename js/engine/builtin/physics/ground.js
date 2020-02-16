import * as Phaser from 'phaser'
import { Builtin } from '../builtin'
import { Constant, Variable } from '../../model/variable'
import { Sprite } from '../ui/sprite'

export class Ground {
    static *update(scope) {
        yield
        yield *Ground.tileCollision(scope)
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

        const movement = Builtin.resolveVariable(objectScope, 'movement').value()
        const velocityObjectInstance = Builtin.resolveVariable(movement.scope, 'velocity').value()

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

        // Check collision
        while (delta.x != 0.0 || delta.y != 0.0) {

            // Calculate target position in current direction
            targetPosition = {
                x: position.x + delta.x,
                y: position.y + delta.y
            }

            // Calculate distance to target
            const targetDistance = Math.sqrt(delta.x*delta.x + delta.y*delta.y)

            // Project lines from current position border edge to target position border edge
            const border = {
                x: delta.x < 0 ? (spriteScope.spriteMeta.left - 1) : (spriteScope.spriteMeta.right + 1),
                y: delta.y < 0 ? (spriteScope.spriteMeta.top - 1) : (spriteScope.spriteMeta.bottom + 1)
            }

            let projectedLines = []
            if (delta.x != 0.0) {
                for (let y = spriteScope.spriteMeta.top + 1; y <= spriteScope.spriteMeta.bottom; y += stepSize.y) {
                    projectedLines.push({startX: border.x, startY: y, endX: border.x + delta.x, endY: y + delta.y})
                }
            }
            if (delta.y != 0.0) {
                for (let x = spriteScope.spriteMeta.left + 1; x <= spriteScope.spriteMeta.right; x += stepSize.x) {
                    projectedLines.push({startX: x, startY: border.y, endX: x + delta.x, endY: border.y + delta.y})
                }
            }

            // Get first collision tile in velocity direction
            const closestCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

            // Check if any collision
            if (closestCollision === undefined) {
                break
            }

            // Position sprite at collision point
            position = {
                x: Math.round(position.x + (delta.x * closestCollision.distance / targetDistance)),
                y: Math.round(position.y + (delta.y * closestCollision.distance / targetDistance))
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

            border = {
                x: delta.x < 0 ? (spriteScope.spriteMeta.left - 1) : (spriteScope.spriteMeta.right + 1),
                y: delta.y < 0 ? (spriteScope.spriteMeta.top - 1) : (spriteScope.spriteMeta.bottom + 1)
            }

            // Horizontal collision
            if (delta.x != 0.0) {
                projectedLines = []
                projectedLines.push({startX: border.x, startY: spriteScope.spriteMeta.top + 1, endX: border.x, endY: spriteScope.spriteMeta.bottom - 1})
                const horizontalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

                if (horizontalCollision !== undefined) {
                    position.x += (border.x - horizontalCollision.x) - Math.sign(delta.x)
                    delta.x = 0.0
                    outputPosition.x = position.x
                    outputVelocity.x = 0.0
                }
            }

            // Vertical collision
            if (delta.y != 0.0) {
                projectedLines = []
                projectedLines.push({startX: spriteScope.spriteMeta.left + 1, startY: border.y, endX: spriteScope.spriteMeta.right - 1, endY: border.y})
                const verticalCollision = Ground.getCollisionPoint(projectedLines, tilemap, layer)

                if (verticalCollision !== undefined) {
                    position.y += (border.y - verticalCollision.y) - Math.sign(delta.y)

                    // Bounce if jumping
                    if (delta.y < 0.0 && Builtin.resolveVariable(objectScope, 'jump') !== undefined) {
                        outputVelocity.y = Math.abs(outputVelocity.y)
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
        }

        // Position sprite at collision point
        position = {
            x: Math.round(outputPosition.x),
            y: Math.round(outputPosition.y)
        }

        objectScope.setVariable('x', new Constant(position.x))
        objectScope.setVariable('y', new Constant(position.y))

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
