import { Scope } from '../model/scope'

export default class Execution {
    constructor(node, scope=undefined) {
        this.node = node
        this.scope = scope || this.node.scope

        this.stopped = false

        this.iterator = this.node.evaluate(this.scope)
    }

    step() {
        try {
            const result = this.iterator.next()
            if (result.done) {
                this.stopped = true
            }
        } catch (error) {
            this.stop()
            throw error
        }
    }

    hasStopped() {
        return this.stopped
    }

    stop() {
        this.stopped = true
    }
}
