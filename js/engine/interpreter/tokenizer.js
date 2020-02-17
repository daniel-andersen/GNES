export default class Tokenizer {
    constructor(language) {
        this.language = language
    }

    tokenizeLines(lines, sourceFilename) {
        const tokenPattern = /^\s*(([0-9]+(\.[0-9]+)*)|([_A-Za-z][_A-Za-z0-9]*)|(\+\=)|(\-\=)|(\*\=)|(\/\=)|\*|\+|\-|\/|\(|\)|\[|\]|\{|\}|(\=\=)|\=|\"|(\<\=)|(\>\=)|\<|\>|(\!\=)|\!|\.|\,)/i

        // Parse all lines
        const tokens = []

        let multilineComment = false

        let lineNumber = 1
        let linePosition = 0
        let tokenIndex = 0
        let tokenStartPosition = 0
        let tokenEndPosition = linePosition

        for (let line of lines) {

            linePosition = 0

            while (true) {

                // Find token
                let token = line.match(tokenPattern)
                if (token === undefined || token === null) {
                    break
                }

                token = token[1].trim()

                // Remove token from line
                const resultingLine = line.replace(tokenPattern, '')

                tokenStartPosition = linePosition
                linePosition += line.length - resultingLine.length
                tokenEndPosition = linePosition - 1

                tokenIndex += 1

                line = resultingLine

                // Find token type
                const type = token in this.language.tokenTypes ? this.language.tokenTypes[token] : this.language.tokenType.Unknown

                // Single line comment - ignore rest of line
                if (type == this.language.tokenType.SingleLineComment) {
                    line = ''
                    continue
                }

                // Multiline comment
                if (type == this.language.tokenType.MultiLineComment) {
                    multilineComment = !multilineComment
                    continue
                }

                // String constant
                if (type == this.language.tokenType.StringDelimiter) {
                    type = this.language.tokenType.StringConstant
                    const endIndex = line.indexOf('"')
                    token = line.substring(0, endIndex != -1 ? endIndex : line.length)
                    line = line.replace(token, '')
                    if (line.startsWith('"')) {
                        line = line.substring(1)
                    }
                    token = '"' + token + '"'
                }

                // Number
                if (type == this.language.tokenType.Unknown && !isNaN(token)) {
                    type = this.language.tokenType.Number
                }

                // Name (upper case start)
                if (type == this.language.tokenType.Unknown && token.charAt(0) == token.charAt(0).toUpperCase()) {
                    type = this.language.tokenType.Name
                }

                // Variable (lower case start)
                if (type == this.language.tokenType.Unknown && token.charAt(0) == token.charAt(0).toLowerCase()) {
                    type = this.language.tokenType.Variable
                }

                // Add token if not part of multiline comment
                if (!multilineComment) {
                    tokens.push({
                        'type': type,
                        'token': token,
                        'lineNumber': lineNumber,
                        'tokenStartPosition': tokenStartPosition,
                        'tokenEndPosition': tokenEndPosition,
                        'tokenIndex': tokenIndex,
                        'filename': sourceFilename
                    })
                }
            }

            // Add EOL
            tokens.push({
                'type': this.language.tokenType.EOL,
                'token': '',
                'lineNumber': lineNumber,
                'tokenStartPosition': tokenEndPosition,
                'tokenEndPosition': tokenEndPosition,
                'tokenIndex': tokenIndex,
                'filename': sourceFilename
            })

            lineNumber += 1
        }

        // Add EOF
        tokens.push({
            'type': this.language.tokenType.EOF,
            'token': '',
            'lineNumber': lineNumber,
            'tokenStartPosition': 0,
            'tokenEndPosition': 0,
            'tokenIndex': tokenIndex,
            'filename': sourceFilename
        })

        return tokens
    }

    findTokenForwards(type, tokens, fromIndex = 0) {
        for (let i = fromIndex; i < tokens.length; i++) {
            if (tokens[i].type == type) {
                return [i, tokens[i]]
            }
        }
        return [undefined, undefined]
    }

    findTokenBackwards(type, tokens, toIndex = 0) {
        for (let i = tokens.length - 1; i > toIndex; i--) {
            if (tokens[i].type == type) {
                return [i, tokens[i]]
            }
        }
        return [undefined, undefined]
    }
}
