import Util from '../util/util'

export default class Interpreter {
    constructor(sourceTree) {
        this.sourceTree = sourceTree

        this.reset()

        this.runTimeMillis = 20
        this.pauseTimeMillis = 5
    }

    reset() {
        this.stopped = false

        this.programExecutions = []
        this.updateExecutions = []

        this.currentExecutions = this.programExecutions
    }

    stop() {
        console.log('Stopping interpreter...')
        this.stopped = true
    }

    hasStopped() {
        return this.stopped
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

        while (!this.hasStopped()) {

            // Switch to component update execution, if any
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

            // Pause execution a while
            if (Util.currentTimeMillis() > nextPauseTime) {
                await Util.sleep(this.pauseTimeMillis)
                nextPauseTime = Util.currentTimeMillis() + this.runTimeMillis
            }
        }
    }

    step() {

        // Execute each executor
        for (let execution of this.currentExecutions.slice()) {

            // Execute
            execution.step()

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
