import Interpreter from './interpreter/interpreter'
import Language from './language/language'
import Execution from './interpreter/execution'
import Tokenizer from './interpreter/tokenizer'
import { SourceTree } from './language/source-tree'
import * as Node from './language/nodes'
import { Scope } from './model/scope'
import { Variable } from './model/variable'
import { Error } from './model/error'
import Util from './util/util'
import { Array } from './builtin/structures/array'
import { Screen } from './builtin/ui/screen'
import { World } from './builtin/ui/world'
import { Sprite } from './builtin/ui/sprite'
import { Tilemap } from './builtin/ui/tilemap'
import { Camera } from './builtin/ui/camera'
import { Joystick } from './builtin/controls/joystick'
import { Gravity } from './builtin/physics/gravity'
import { AirDrag } from './builtin/physics/air-drag'
import { Ground } from './builtin/physics/ground'
import { Movement } from './builtin/movement/movement'
import { TileMovement } from './builtin/movement/tile-movement'
import * as Phaser from 'phaser'

export default class Engine {
    constructor(referenceWidth=1280, referenceHeight=800) {
        this.nativeClasses = {
            Array: Array,
            Screen: Screen,
            World: World,
            Sprite: Sprite,
            Tilemap: Tilemap,
            Camera: Camera,
            Joystick: Joystick,
            Gravity: Gravity,
            AirDrag: AirDrag,
            Ground: Ground,
            Movement: Movement,
            TileMovement: TileMovement,
        }
        this.builtinFiles = [
            "./assets/engine/structures/array.basic",
            "./assets/engine/structures/dictionary.basic",
            "./assets/engine/ui/position.basic",
            "./assets/engine/ui/screen.basic",
            "./assets/engine/ui/world.basic",
            "./assets/engine/ui/sprite.basic",
            "./assets/engine/ui/tilemap.basic",
            "./assets/engine/ui/camera.basic",
            "./assets/engine/controls/joystick.basic",
            "./assets/engine/physics/gravity.basic",
            "./assets/engine/physics/air-drag.basic",
            "./assets/engine/physics/ground.basic",
            "./assets/engine/movement/moveable.basic",
            "./assets/engine/movement/movement.basic",
            "./assets/engine/movement/tile-movement.basic",
            "./assets/engine/movement/jump.basic",
        ]

        this.runCallback = undefined
        this.stopCallback = undefined
        this.pauseCallback = undefined
        this.resumeCallback = undefined

        this.referenceWidth = referenceWidth
        this.referenceHeight = referenceHeight
    }

    async run(filenames=[], texts=[]) {

        // Setup
        await this.setup()

        // Parse files
        this.language = new Language()
        this.sourceTree = new SourceTree(this.language, this.nativeClasses, this.builtinFiles)

        const result = await this.sourceTree.build(filenames, texts)
        if (result instanceof Error) {
            throw result
        }

        // Prepare execution
        const execution = new Execution(this.sourceTree.programNode)

        this.interpreter = new Interpreter(this.sourceTree)
        this.interpreter.stopCallback = () => { this.interpreterStoped() }
        this.interpreter.addExecution(execution)

        document.addEventListener('keydown', event => {
            if (!event.isComposing && event.keyCode === 27) {
                this.stop()
            }
        })

        // Run program
        console.log('Running...')

        this.start()
    }

    interpreterStoped() {
        console.log('Engine stopped')
        if (this.stopCallback !== undefined) {
            this.stopCallback()
        }
        this.destroy()
    }

    start() {
        if (this.isRunning() || this.isPaused()) {
            this.stop()
        }
        this.interpreter.run()
        if (this.runCallback !== undefined) {
            this.runCallback()
        }
    }

    stop() {
        this.interpreter.stop()
    }

    pause() {
        this.interpreter.pause()
        if (this.pauseCallback !== undefined) {
            this.pauseCallback()
        }
    }

    resume() {
        this.interpreter.resume()
        if (this.resumeCallback !== undefined) {
            this.resumeCallback()
        }
    }

    isRunning() {
        return this.interpreter !== undefined && this.interpreter.isRunning()
    }

    hasStopped() {
        return this.interpreter === undefined || this.interpreter.hasStopped()
    }

    isPaused() {
        return this.interpreter !== undefined && this.interpreter.isPaused()
    }

    update() {
        if (this.interpreter === undefined || this.interpreter.hasStopped()) {
            return
        }

        // Add all objects with Update method to update cycle
        this.addUpdateExecutions()

        // Notify waiting executions that we're updating
        this.notifyWaitingExecutions()
    }

    notifyWaitingExecutions() {
        for (let callback of this.sourceTree.programNode.scope.onUpdateCallbacks) {
            callback()
        }
        this.sourceTree.programNode.scope.onUpdateCallbacks = []
    }

    addExecution(execution) {
        this.interpreter.addExecution(execution)
    }

    addUpdateExecutions() {
        let executions = []

        // Add class update (shared update functions)
        for (let classNode of this.sourceTree.programNode.scope.updateClasses) {
            const functionCallNode = new Node.FunctionCallNode([], '_update', new Node.ParameterListNode([], []))
            executions.push(new Execution(functionCallNode, classNode.sharedScope))
        }

        // Add object update
        for (let object of Object.values(this.sourceTree.programNode.scope.updateObjects)) {

            // Add behaviours
            for (let i = object.scopes.length - 1; i >= 0; i--) {
                let scope = object.scopes[i]
                for (let behaviourObject of scope.behaviourObjects) {
                    const functionCallNode = new Node.FunctionCallNode([], '_update', new Node.ParameterListNode([], []))
                    executions.push(new Execution(functionCallNode, behaviourObject.scope))
                }
            }

            // Add Update function
            for (let i = object.scopes.length - 1; i >= 0; i--) {
                let scope = object.scopes[i]
                for (let functionNode of Object.values(scope.functions)) {
                    if (functionNode.functionName == '_update') {
                        const functionCallNode = new Node.FunctionCallNode([], '_update', new Node.ParameterListNode([], []))
                        executions.push(new Execution(functionCallNode, scope))
                    }
                }
            }
        }

        this.interpreter.setUpdateExecutions(executions)
    }

    async setup() {

        // Destroy existing game, if any
        this.destroy(true)

        // Setup new game
        window.game = {}

        await this.setupPhaser()
        await this.setupConsole()
    }

    destroy(removeElements=false) {
        if (window.game === undefined) {
            return
        }

        console.log("Destroying game...")

        // Destroy phaser game
        if (window.game.phaser !== undefined) {
            if (window.game.phaser.game !== undefined) {
                window.game.phaser.game.destroy(removeElements)
                window.game.phaser.game = undefined
            }
        }

        // Destroy console
        if (removeElements) {
            if (window.game.console !== undefined) {
                document.getElementById('gnes').removeChild(window.game.console.div)
            }
            window.game.console = undefined
        }

        // Remove elements
        if (removeElements) {
            const node = document.getElementById('gnes')
            while (node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }
        }
    }

    async setupPhaser() {

        // Create phaser instance
        const promise = new Promise((resolve, reject) => {
            const gameConfig = {
                title: 'GNES',
                type: Phaser.AUTO,
                parent: 'gnes',
                transparent: false,
                backgroundColor: '#000000',
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: this.referenceWidth,
                    height: this.referenceHeight
                },
                scene: {
                    create: function() {
                        window.game.phaser.scene = this
                        resolve()
                    },
                    update: () => {
                        this.update()
                    }
                }
            }

            window.game.phaser = {
                game: new Phaser.Game(gameConfig)
            }
        })

        await promise

        // Add config
        window.game.phaser.config = {
            size: {
                width: this.referenceWidth,
                height: this.referenceHeight
            }
        }

        // Add default groups
        window.game.phaser.groups = {
            default: window.game.phaser.scene.add.group(),
            sprites: window.game.phaser.scene.add.group(),
            enemies: window.game.phaser.scene.add.group(),
            loot: window.game.phaser.scene.add.group(),
        }

        // Add text
        /*window.game.phaser.text = {
            group: window.game.phaser.scene.add.text(8, 8, [], { font: '16px Courier', fill: '#ffffff' }),
            lines: []
        }
        window.game.phaser.scene.add.text(8, 8, [], { font: '16px Courier', fill: '#ffffff' }),*/
    }

    async setupConsole() {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.left = 0
        div.style.top = 0
        div.style.width = '100vw'
        div.style.height = '100vh'
        div.style.color = 'white'
        document.getElementById('gnes').appendChild(div)

        window.game.console = {
            div: div
        }
    }
}

Engine.sharedInstance = new Engine()
