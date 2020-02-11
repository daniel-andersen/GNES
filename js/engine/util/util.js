export default class Util {
    static currentTimeMillis() {
        return new Date().getTime()
    }

    static sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

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
                    else {
                        reject('Failed to load ' + filename)
                    }
                }
            }
            xmlHttpRequest.send(null)
        })
    }

    static readJsonFile(filename) {
        return new Promise((resolve, reject) => {
            Util.readTextFile(filename).then((text) => {
                const json = JSON.parse(text)
                resolve(json)
            })
        })
    }
}
