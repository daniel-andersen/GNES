import Engine from './engine/engine'
import Editor from './editor/editor'

document.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine()

    const editor = new Editor(engine)
})
