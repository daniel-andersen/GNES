import Util from '../util/util'

export default class Interpreter {
    constructor(sourceTree) {
        this.sourceTree = sourceTree

        this.reset()

        this.runTimeMillis = 5
        this.pauseTimeMillis = 1

        this.stopCallback = undefined
    }

    reset() {
        this.stopped = true
        this.paused = false

        this.programExecutions = []
        this.updateExecutions = []

        this.currentExecutions = this.programExecutions
    }

    stop() {
        console.log('Stopping interpreter...')
        this.stopped = true
    }

    pause() {
        this.paused = true
    }

    resume() {
        this.paused = false
    }

    isRunning() {
        return !this.hasStopped()
    }

    hasStopped() {
        return this.stopped
    }

    isPaused() {
        return this.paused
    }

    addExecution(execution) {
        this.programExecutions.push(execution)
    }

    setUpdateExecutions(executions) {
        if (this.updateExecutions.length > 0) {
            return
        }
        this.updateExecutions = executions
    }

    async run() {
        let nextPauseTime = Util.currentTimeMillis() + this.runTimeMillis

        this.stopped = false

        while (!this.hasStopped()) {

            // Paused
            if (this.paused) {
                await Util.sleep(this.pauseTimeMillis)
                continue
            }

            // Switch to update execution, if any
            if (this.updateExecutions.length > 0) {
                this.currentExecutions = this.updateExecutions
            }

            // Switch to program execution, if no update executions left
            else {
                this.currentExecutions = this.programExecutions
            }

            // Step executions
            this.step()

            // Check if all program executors are stopped
            this.stopped = this.programExecutions.length === 0

            // Pause execution a while (if not in update mode)
            if (Util.currentTimeMillis() > nextPauseTime && this.updateExecutions.length == 0) {
                await Util.sleep(this.pauseTimeMillis)
                nextPauseTime = Util.currentTimeMillis() + this.runTimeMillis
            }
        }

        // Stop callback
        if (this.stopCallback !== undefined) {
            this.stopCallback()
        }
    }

    step() {

        // Excecute first update execution
        if (this.updateExecutions.length > 0) {
            const execution = this.currentExecutions[0]

            // Execute
            try {
                execution.step()
            } catch (error) {
                console.log('Runtime error', error)
            }

            // Remove if stopped
            if (execution.hasStopped()) {
                this.currentExecutions.splice(0, 1)
            }
        }

        // Execute all other executors simultaniously
        else {
            for (let execution of this.currentExecutions.slice()) {

                // Execute
                try {
                    execution.step()
                } catch (error) {
                    console.log('Runtime error', error)
                }

                // Remove if stopped
                if (execution.hasStopped()) {
                    const index = this.currentExecutions.indexOf(execution)
                    if (index > -1) {
                        this.currentExecutions.splice(index, 1)
                    }
                }
            }
        }
    }
}
