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
import { Sprite } from './builtin/ui/sprites'
import * as Phaser from 'phaser'

export default class Engine {
    constructor() {
        this.nativeClasses = {
            Sprite: Sprite,
        }
        this.builtinFiles = [
            "/assets/engine/lifecycle/component.basic",
            "/assets/engine/ui/screen.basic",
            "/assets/engine/ui/sprite.basic",
        ]
    }

    async run(filenames) {

        // Setup
        await this.setup()

        // Parse files
        this.language = new Language()
        this.sourceTree = new SourceTree(this.language, this.nativeClasses, this.builtinFiles)

        const result = await this.sourceTree.build(filenames)
        if (result instanceof Error) {
            throw result
        }

        // Prepare execution
        const execution = new Execution(this.sourceTree.programNode)

        this.interpreter = new Interpreter(this.sourceTree)
        this.interpreter.addExecution(execution)

        document.addEventListener('keydown', event => {
            if (!event.isComposing && event.keyCode === 27) {
                this.interpreter.stop()
            }
            if (event.keyCode === 32) {
                this.destroy()
            }
        })

        // Run program
        console.log('Running...')

        await this.interpreter.run()

        console.log('Done!')

        setTimeout(() => {
            this.destroy()
        }, 2000)
    }

    update() {
        if (this.interpreter === undefined || this.interpreter.hasStopped()) {
            return
        }

        // Log FPS
        if (this.fpsTime === undefined) {
            this.fpsTime = Util.currentTimeMillis()
            this.fpsCount = 0
        }
        if (Util.currentTimeMillis() - this.fpsTime > 1000) {
            console.log('FPS:', Math.round((Util.currentTimeMillis() - this.fpsTime) / this.fpsCount))
            this.fpsTime += 1000
            this.fpsCount = 0
        }
        this.fpsCount += 1

        // Add all components to update cycle
        this.addComponentUpdateExecutions()

        // Notify waiting executions that we're updating
        this.notifyWaitingExecutions()
    }

    notifyWaitingExecutions() {
        for (let callback of this.sourceTree.programNode.scope.onUpdateCallbacks) {
            callback()
        }
        this.sourceTree.programNode.scope.onUpdateCallbacks = []
    }

    addComponentUpdateExecutions() {
        let executions = []

        for (let object of Object.values(this.sourceTree.programNode.scope.components)) {
            for (let scope of object.scopes) {
                for (let functionNode of Object.values(scope.functions)) {
                    if (functionNode.functionName == 'update') {
                        const functionCallNode = new Node.FunctionCallNode([], 'update', new Node.ParameterListNode([], []))
                        executions.push(new Execution(functionCallNode, scope))
                    }
                }
            }
        }

        this.interpreter.setUpdateExecutions(executions)
    }

    async setup() {

        // Destroy existing game, if any
        this.destroy()

        // Setup new game
        window.game = {}

        await this.setupPhaser()
        await this.setupConsole()
    }

    destroy() {
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
            //document.body.removeChild(window.game.console.div)
            window.game.console = undefined
        }
    }

    async setupPhaser() {

        // Create phaser instance
        const promise = new Promise((resolve, reject) => {
            const gameConfig = {
                title: 'GNES',
                type: Phaser.AUTO,
                scale: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        debug: true,
                    },
                },
                parent: 'game',
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
        document.body.appendChild(div)

        window.game.console = {
            div: div
        }
    }
}

Engine.sharedInstance = new Engine()
