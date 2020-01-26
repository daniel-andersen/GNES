export default class Tokenizer {
    constructor(language) {
        this.language = language
    }

    tokenizeLines(lines) {
        const tokenPattern = /^\s*(\w+|"|[^A-Za-z0-9_\(\)"]+|\(|\))/i

        // Parse all lines
        const tokens = []

        var multilineComment = false

        for (let line of lines) {

            while (true) {

                // Find token
                let token = line.match(tokenPattern)
                if (token === undefined || token === null) {
                    break
                }

                token = token[1].trim()

                // Remove token from line
                line = line.replace(tokenPattern, '')

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
                        'token': token
                    })
                }
            }

            // Add EOL
            tokens.push({
                'type': this.language.tokenType.EOL,
                'token': ''
            })
        }

        // Add EOF
        tokens.push({
            'type': this.language.tokenType.EOF,
            'token': ''
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
