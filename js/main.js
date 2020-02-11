import Engine from './engine/engine'
import Editor from './editor/editor'

document.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine()
    window.engine = engine

    const editor = new Editor(engine)
    editor.load(['/assets/tests/test.basic'])
})
