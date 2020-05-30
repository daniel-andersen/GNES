import Engine from './engine/engine'
import Editor from './editor/editor'

document.addEventListener('DOMContentLoaded', () => {
    const runTests = false

    const engine = new Engine()
    window.engine = engine

    if (runTests) {
        engine.run([
            './assets/tests/loops-basic.basic',
            './assets/tests/control-structures.basic',
            './assets/tests/functions-basic.basic',
            './assets/tests/functions-fibonacci.basic',
            './assets/tests/classes-basic.basic',
            './assets/tests/classes-inheritance.basic',
        ])
    }

    const editor = new Editor(engine)
    editor.load([
        './assets/examples/empty.basic',
        './assets/examples/tutorial/001-print.basic',
        './assets/examples/tutorial/002-variables.basic',
        './assets/examples/tutorial/003-for-loop.basic',
        './assets/examples/tutorial/004-sprites.basic',
        './assets/examples/mario.basic',
        './assets/examples/dungeon-crawl.basic',
    ])
})
