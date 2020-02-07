import * as CodeMirror from 'codemirror'
import CodeMirrorBasicMode from './codemirror-basic'
import Util from '../engine/util/util'

export default class Editor {
    constructor(engine) {
        this.engine = engine
        this.textArea = document.getElementById('editor')

        // Setup buttons
        this.playButton = document.getElementById('editor-play')
        this.stopButton = document.getElementById('editor-stop')
        this.pauseButton = document.getElementById('editor-pause')
        this.resumeButton = document.getElementById('editor-resume')

        this.playButton.addEventListener('click', () => { this.play() }, false)
        this.stopButton.addEventListener('click', () => { this.stop() }, false)
        this.pauseButton.addEventListener('click', () => { this.pause() }, false)
        this.resumeButton.addEventListener('click', () => { this.resume() }, false)

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

        // Setup engine callbacks
        this.engine.runCallback = () => { this.updatePlayButtons() }
        this.engine.stopCallback = () => { this.updatePlayButtons() }
        this.engine.pauseCallback = () => { this.updatePlayButtons() }
        this.engine.resumeCallback = () => { this.updatePlayButtons() }
    }

    async load(files) {
        for (let filename of files) {
            const text = await Util.readTextFile(filename)
            this.codeMirror.setValue(text)
        }
    }

    play() {
        if (this.engine.hasStopped()) {
            this.engine.run([], [this.codeMirror.getValue()])
        }
        else if (this.engine.isPaused()) {
            this.engine.resume()
        }
    }

    stop() {
        if (this.engine.isRunning()) {
            this.engine.stop()
        }
    }

    pause() {
        if (this.engine.isRunning()) {
            this.engine.pause()
        }
    }

    resume() {
        if (this.engine.isPaused()) {
            this.engine.resume()
        }
    }

    updatePlayButtons() {
        this.playButton.style.visibility = this.engine.hasStopped() ? 'visible' : 'hidden'
        this.stopButton.style.visibility = this.engine.isRunning() ? 'visible' : 'hidden'
        this.pauseButton.style.visibility = this.engine.isRunning() ? 'visible' : 'hidden'
        this.resumeButton.style.visibility = this.engine.isPaused() ? 'visible' : 'hidden'
    }
}
