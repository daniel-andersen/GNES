import Interpreter from './interpreter/interpreter'
import Language from './language/language'
import Execution from './interpreter/execution'
import Tokenizer from './interpreter/tokenizer'
import { SourceTree } from './language/source-tree'
import { Scope } from './model/scope'
import { Variable } from './model/variable'

export default class Engine {
    constructor() {
        this.globals = {}
        this.globals.scope = new Scope()
        this.builtins = [
            "/assets/language/sprites/sprite.basic"
        ]
    }

    async run(filenames) {
        const language = new Language()
        const sourceTree = new SourceTree(language)
        await sourceTree.build(this.builtins.concat(filenames))

        const execution = new Execution(sourceTree.programNode)

        const interpreter = new Interpreter(sourceTree)
        interpreter.addExecution(execution)

        document.addEventListener('keydown', event => {
            if (!event.isComposing && event.keyCode === 27) {
                interpreter.stop()
            }
        })

        console.log('Running...')

        interpreter.run()

        console.log('Done!')
    }
}

Engine.sharedInstance = new Engine()
