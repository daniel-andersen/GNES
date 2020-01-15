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
        this.executions = []
    }

    stop() {
        console.log('Stopping interpreter...')
        this.stopped = true
    }

    hasStopped() {
        return this.stopped
    }

    addExecution(execution) {
        this.executions.push(execution)
    }

    async run() {
        let nextPauseTime = Util.currentTimeMillis() + this.runTimeMillis

        while (!this.hasStopped()) {
            this.step()

            // Pause execution a while
            if (Util.currentTimeMillis() > nextPauseTime) {
                await Util.sleep(this.pauseTimeMillis)
                nextPauseTime = Util.currentTimeMillis() + this.runTimeMillis
            }
        }
    }

    step() {

        // Execute each executor
        let doneExecutors = []
        for (let execution of this.executions) {

            // Execute
            execution.step()

            // Check if stopped
            if (execution.hasStopped()) {
                doneExecutors.push(execution)
            }
        }

        // Remove done executors
        for (let execution of doneExecutors) {
            const index = this.executions.indexOf(execution)
            if (index > -1) {
              this.executions.splice(index, 1)
            }
        }

        // Check if all executors are stopped
        this.stopped = this.executions.length === 0
    }
}
