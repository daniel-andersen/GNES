class Tokenizer
  constructor: (@language) ->

  tokenizeLines: (lines) ->
    tokenPattern = /^\s*(\w+|"|[^A-Za-z0-9_"]+)/i

    # Parse all lines
    allTokens = []

    multilineComment = false

    for line in lines

      lineTokens = []

      while true

        # Find token
        token = line.match(tokenPattern)
        if not token?
          break

        token = token[1].trim()

        # Remove token from line
        line = line.replace(tokenPattern, '')

        # Find token type
        type = if token of @language.tokenTypes then @language.tokenTypes[token] else @language.tokenType.Variable

        # Single line comment - ignore rest of line
        if type == @language.tokenType.SingleLineComment
          line = ''
          continue

        # Multiline comment
        if type == @language.tokenType.MultiLineComment
          multilineComment = not multilineComment
          continue

        # String constant
        if type == @language.tokenType.StringDelimiter
          type = @language.tokenType.StringConstant
          endIndex = line.indexOf('"')
          token = line.substring(0, if endIndex != -1 then endIndex else line.length)
          line = line.replace(token, '')
          if line.startsWith('"')
            line = line.substring(1)

        # Add token if not part of multiline comment
        if not multilineComment
          lineTokens.push({
            'type': type
            'token': token
          })

      # Add line tokens
      allTokens.push(lineTokens)

    return allTokens

  findTokenForwards: (type, tokens, fromIndex = 0) ->
    for i in [fromIndex...tokens.length]
      if tokens[i].type == type
        return [i, tokens[i]]
    return [undefined, undefined]

  findTokenBackwards: (type, tokens, toIndex = 0) ->
    for i in [(tokens.length - 1)...toIndex]
      if tokens[i].type == type
        return [i, tokens[i]]
    return [undefined, undefined]
