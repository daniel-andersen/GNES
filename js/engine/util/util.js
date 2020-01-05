export default class Util {
    static uuid() {
        return Util._S4() + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + '-' + Util._S4() + Util._S4() + Util._S4()
    }

    static _S4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1)
    }

    static readTextFile(filename) {
        return new Promise((resolve, reject) => {
            const xmlHttpRequest = new XMLHttpRequest()
            xmlHttpRequest.open('GET', filename)
            xmlHttpRequest.onreadystatechange = () => {
                if (xmlHttpRequest.readyState === 4) {
                    if (xmlHttpRequest.status === 200 || xmlHttpRequest.status == 0) {
                        resolve(xmlHttpRequest.responseText)
                    }
                }
            }
            xmlHttpRequest.send(null)
        })
    }
}
