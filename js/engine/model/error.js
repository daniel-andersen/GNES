export class Error {
    constructor(description, token=undefined, node=undefined) {
        this.description = description
        this.token = token
        this.node = node

        this.firstToken = undefined
        if (token !== undefined) {
            this.firstToken = token
        }
        if (this.firstToken === undefined && node !== undefined) {
            this.firstToken = node.tokens[0]
        }
    }
}
