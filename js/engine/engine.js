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
import { Screen } from './builtin/ui/screen'
import { Sprite } from './builtin/ui/sprites'
import { Joystick } from './builtin/controls/joystick'
import * as Phaser from 'phaser'

export default class Engine {
    constructor() {
        this.nativeClasses = {
            Screen: Screen,
            Sprite: Sprite,
            Joystick: Joystick,
        }
        this.builtinFiles = [
            "./assets/engine/ui/screen.basic",
            "./assets/engine/ui/sprite.basic",
            "./assets/engine/controls/joystick.basic",
            "./assets/engine/physics/gravity.basic",
        ]
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
        this.interpreter.addExecution(execution)

        document.addEventListener('keydown', event => {
            if (!event.isComposing && event.keyCode === 27) {
                this.stop()
            }
        })

        // Run program
        console.log('Running...')

        await this.interpreter.run()

        console.log('Done!')
    }

    start() {
        this.stop()
        this.interpreter.start()
    }

    stop() {
        this.interpreter.stop()
        this.destroy()
    }

    pause() {
        this.interpreter.pause()
    }

    resume() {
        this.interpreter.resume()
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
                window.game.phaser.game.destroy()
                //window.game.phaser.game.destroy(true)
                window.game.phaser.game = undefined
            }
        }

        // Destroy console
        if (window.game.console !== undefined) {
            document.getElementById('gnes').removeChild(window.game.console.div)
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
                width: '100%',
                height: '100%',
                physics: {
                    default: 'arcade',
                    arcade: {
                        debug: true,
                    },
                },
                parent: 'gnes',
                transparent: false,
                backgroundColor: '#000000',
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
