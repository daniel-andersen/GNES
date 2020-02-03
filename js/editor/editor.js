import * as CodeMirror from 'codemirror'
import CodeMirrorBasicMode from './codemirror-basic'

export default class Editor {
    constructor(engine) {
        this.engine = engine
        this.textArea = document.getElementById('editor')

        // Setup buttons
        this.playButton = document.getElementById('editor-play')
        this.stopButton = document.getElementById('editor-stop')
        this.pauseButton = document.getElementById('editor-pause')

        this.playButton.addEventListener('click', () => { this.play() }, false)
        this.stopButton.addEventListener('click', () => { this.stop() }, false)
        this.pauseButton.addEventListener('click', () => { this.pause() }, false)

        this.updatePlayButtons()

        // Setup CodeMirror
        CodeMirrorBasicMode.define()

        this.config = {
            tabSize: 4,
            indentUnit: 4,
            lineNumbers: true,
            theme: 'twilight',
            addons: ['mode/simple'],
            mode: 'gnes-basic',
        }

        this.codeMirror = CodeMirror.fromTextArea(this.textArea, this.config)
        this.codeMirror.setSize('100vw', '50vh')
    }

    play() {
        setTimeout(() => {
            if (this.engine.hasStopped()) {
                this.engine.run([], [this.codeMirror.getValue()])
            }
            else if (this.engine.isPaused()) {
                this.engine.resume()
            }
        }, 10)
        setTimeout(() => {
            this.updatePlayButtons()
        }, 100)
    }

    stop() {
        setTimeout(() => {
            if (this.engine.isRunning()) {
                this.engine.stop()
            }
        }, 10)
        setTimeout(() => {
            this.updatePlayButtons()
        }, 100)
    }

    pause() {
        setTimeout(() => {
            if (this.engine.isRunning()) {
                this.engine.pause()
            }
        }, 10)
        setTimeout(() => {
            this.updatePlayButtons()
        }, 100)
    }

    updatePlayButtons() {
        this.playButton.style.visibility = this.engine.hasStopped() ? 'visible' : 'hidden'
        this.stopButton.style.visibility = this.engine.isRunning() ? 'visible' : 'hidden'
        //this.pauseButton.style.display = this.engine.isRunning() ? 'visible' : 'hidden'
    }
}
