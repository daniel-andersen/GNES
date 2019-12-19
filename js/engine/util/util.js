export default class Util {
    static uuid() {
        return Util._S4() + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + Util._S4() + Util._S4()
    }

    static _S4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1)
    }
}
