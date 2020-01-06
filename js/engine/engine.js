import Interpreter from './interpreter/interpreter'
import Language from './interpreter/language'
import Execution from './interpreter/execution'
import Tokenizer from './interpreter/tokenizer'
import { SourceTree } from './interpreter/source-tree'
import { Scope } from './model/scope'
import { Variable } from './model/variable'

export default class Engine {
    constructor() {
        this.globals = {}
        this.globals.scope = new Scope()
    }

    async run(filenames) {
        const language = new Language()
        const sourceTree = new SourceTree(language)
        await sourceTree.build(filenames)

        const execution = new Execution(sourceTree.programNode)

        const interpreter = new Interpreter(sourceTree)
        interpreter.addExecution(execution)

        document.addEventListener('keydown', event => {
            if (event.isComposing || event.keyCode === 229) {
                return
            }
            interpreter.stop()
        })

        while (!interpreter.hasStopped()) {
            interpreter.step()
        }
        console.log(execution.scope)

        console.log('Done!')
    }
}

Engine.sharedInstance = new Engine()
