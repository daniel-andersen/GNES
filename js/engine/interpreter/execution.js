import { Scope } from '../model/scope'

export default class Execution {
    constructor(node, scope=new Scope()) {
        this.node = node
        this.scope = scope

        this.stopped = false

        this.iterator = this.node.evaluate(this.scope)
    }

    step() {
        const result = this.iterator.next()
        if (result.done) {
            console.log('Executor done')
            this.stopped = true
        }
    }

    hasStopped() {
        return this.stopped
    }
}
