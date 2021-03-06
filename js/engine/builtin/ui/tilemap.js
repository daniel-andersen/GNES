import { Builtin } from '../builtin'
import { Error } from '../../model/error'
import { Constant, Variable } from '../../model/variable'
import Util from '../../util/util'

export class Tilemap {
    static *load(scope, objectInstance) {

        // Resolve filename
        const filenameConstant = Builtin.resolveParameter(scope, 'filename')
        if (filenameConstant === undefined) {
            throw new Error('"filename" not given as parameter.')
        }
        const filename = filenameConstant.value()

        // Resolve object scope
        const objectScope = Builtin.resolveObjectScope(scope, 'Tilemap')
        if (objectScope === undefined) {
            throw new Error('Native "Tilemap.Load" can only be called from Tilemap class.')
        }

        // Pick random names
        objectScope.tilemapName = Util.uuid()

        // Load tilemap
        console.log('Loading tilemap with filename', Builtin.resolveParameter(scope, 'filename').value())

        let success = true
        let complete = false

        Builtin.scene().load.tilemapTiledJSON(objectScope.tilemapName, filename)
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
            throw new Error('Could not load tilemap "' + filename + '"')
        }

        // Create tilemap
        objectScope.tilemap = Builtin.scene().make.tilemap({ key: objectScope.tilemapName })

        // Load tilemap as json
        yield
        const json = yield* Builtin.loadJson(filename)

        // Load tilesets
        yield
        objectScope.tilesets = yield* Tilemap.loadTilesets(objectScope.tilemap, json)

        // Add tileset images
        objectScope.tilesetImages = Tilemap.addTilesetImages(objectScope.tilemap, objectScope.tilesets)

        // Add layers
        objectScope.layers = Tilemap.addLayers(objectScope.tilemap, objectScope.tilesets, json)

        // Add sprite layers
        objectScope.spriteLayers = []
        for (let layer of objectScope.layers) {
            const group = Builtin.scene().add.group()
            group.setDepth(layer._layerIndex + 1)
            objectScope.spriteLayers.push(group)
        }

        // Set width and height
        objectScope.setVariable('width', new Constant(objectScope.tilemap.widthInPixels))
        objectScope.setVariable('height', new Constant(objectScope.tilemap.heightInPixels))

        // Register world variables
        const world = Builtin.resolveClass(objectScope, 'World')
        world.sharedScope.setVariable('width', new Constant(objectScope.tilemap.widthInPixels))
        world.sharedScope.setVariable('height', new Constant(objectScope.tilemap.heightInPixels))
        world.sharedScope.setVariable('tilemap', new Constant(objectScope.objectInstance))

        // Set camera bounding box
        Builtin.scene().cameras.main.setBounds(0, 0, objectScope.tilemap.widthInPixels, objectScope.tilemap.heightInPixels)
    }

    static *loadTilesets(map, json) {

        // As for now, only one tileset supported
        if (json.tilesets.length > 1) {
            throw new Error('Only one tileset in map supported')
        }

        let tilesets = []

        for (let tilesetJson of json.tilesets) {
            yield
            const id = Util.uuid()
            const tileset = {
                id: id,
                name: tilesetJson.name,
                imageFilename: tilesetJson.image,
                tileset: yield *Tilemap.loadTileset(map, tilesetJson.name, tilesetJson.image, id),
            }
            tilesets.push(tileset)
        }

        return tilesets
    }

    static *loadTileset(map, name, filename, id) {
        console.log('Loading tileset with name ' + name + ' and filename ' + filename)

        let success = true
        let complete = false

        Builtin.scene().load.image(id, filename)
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
            throw new Error('Could not load tileset image "' + filename + '"')
        }

        // Add tileset image
        return map.addTilesetImage(name, id)
    }

    static addTilesetImages(map, tilesets) {
        let tilesetImages = []
        for (let tileset of tilesets) {
            const tilesetImage = map.addTilesetImage(tileset.name, tileset.id)
            tilesetImages.push(tilesetImage)
        }
        return tilesetImages
    }

    static addLayers(map, tilesets, json) {
        let layers = []
        for (let i = 0; i < json.layers.length; i++) {
            if (json.layers[i].type != 'tilelayer') {
                continue
            }
            if (tilesets.length == 0) {
                throw new Error('No tileset in tilemap')
            }
            const layer = map.createStaticLayer(i, tilesets[0].tileset, json.layers[i].x, json.layers[i].y)
            layer._layerIndex = i * 100
            layer.setDepth(layer._layerIndex)
            layers.push(layer)
        }
        return layers
    }
}
