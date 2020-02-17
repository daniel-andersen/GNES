import * as CodeMirror from 'codemirror'
import CodeMirrorBasicMode from './codemirror-basic'
import { Error } from '../engine/model/error'
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

        this.playButton.addEventListener('click', async () => { this.play() }, false)
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
        this.codeMirror.on('change', async () => {
            await this.onChange()
        })

        // Setup state
        this.state = {
            onChangeTimeout: undefined,
            compileInterval: 2000,
            compiling: false,
            markings: [],
            filename: '',
        }

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
            this.state.filename = filename
        }
    }

    async play() {
        if (this.engine.hasStopped()) {
            const result = await this.engine.run([], [{text: this.codeMirror.getValue(), filename: this.state.filename}])
            this.clearErrors()
            if (result instanceof Error) {
                this.onError(result)
            }
            else {
                console.log(result)
            }
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

    async compile() {
        if (this.state.compiling) {
            this.state.onChangeTimeout = setTimeout(() => {
                this.compile()
            }, this.state.compileInterval)
            return
        }

        this.state.compiling = true

        const result = await this.engine.compile([], [{text: this.codeMirror.getValue(), filename: this.state.filename}])
        this.clearErrors()
        if (result instanceof Error) {
            this.onError(result)
        }

        this.state.compiling = false
    }

    async onChange() {
        if (this.state.onChangeTimeout !== undefined) {
            clearInterval(this.state.onChangeTimeout)
            this.state.onChangeTimeout = undefined
        }

        this.state.onChangeTimeout = setTimeout(() => {
            this.compile()
        }, this.state.compileInterval)
    }

    onError(error) {
        this.clearErrors()

        if (error.token === undefined && error.node === undefined) {
            return
        }
        console.log(error)

        const token = error.token !== undefined ? error.token : error.node.tokens[0]

        const filename = token.filename
        if (filename != this.state.filename) {
            return
        }

        const from = {line: token.lineNumber - 1, ch: token.tokenStartPosition}
        const to = {line: token.lineNumber - 1, ch: token.tokenEndPosition + 1}

        const errorMarking = this.codeMirror.markText(from, to, {className: 'editor-error', title: error.description})
        this.state.markings.push(errorMarking)
    }

    clearErrors() {
        for (let marking of this.state.markings) {
            marking.clear()
        }
        this.state.markings = []
    }
}
