import Engine from './engine/engine'

document.addEventListener('DOMContentLoaded', () => {
    const engine = new Engine()
    engine.run(["./assets/tests/test.basic"])
})
