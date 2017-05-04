class Tokenizer
  constructor: (@language) ->

  tokenizeLines: (lines) -> (@tokenizeLine(line) for line in lines)

  tokenizeLine: (line) ->
    tokens = []

    tokenPattern = /^\s*(\w+|\W+)/i

    while true

      # Find token
      token = line.match(tokenPattern)
      if not token?
        break

      token = token[1]

      # Add token
      type = if token of @language.tokenTypes then @language.tokenTypes[token] else @language.tokenType.Variable

      tokens.push({
        'type': type
        'token': token
      })

      # Remove token from line
      line = line.replace(tokenPattern, '')

    return tokens
