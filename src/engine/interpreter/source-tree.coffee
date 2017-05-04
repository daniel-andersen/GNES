class SourceTree
  constructor: (@language) ->
    @tokenizer = new Tokenizer(@language)

    @statementParser =
      "#{@language.statement.SingleLineComment}": @parseSingleLineComment
      "#{@language.statement.MultiLineComment}": @parseMultiLineComment
      "#{@language.statement.If}": @parseIfStatement
      "#{@language.statement.Else}": @parseElseStatement
      "#{@language.statement.End}": @parseEndStatement

  build: (files) ->
    @buildFromLines(file) for file in files

  buildFromLines: (lines) ->

    # Tokenize lines
    allTokens = @tokenizer.tokenizeLines(lines)
    console.log(allTokens)

    # Parse lines
    for lineTokens in allTokens

      # Empty line
      if lineTokens.length == 0
        continue

      # Check if known start of statement
      firstToken = lineTokens[0]
      statementType = @language.statementStart[firstToken.type]

      if statementType?
        @parseStatement(statementType, lineTokens)

  parseStatement: (statementType, tokens) ->
    parseFunction = @statementParser[statementType]
    if parseFunction?
      parseFunction(tokens)

  parseSingleLineComment: (tokens) ->

  parseMultiLineComment: (tokens) ->

  parseIfStatement: (tokens) ->
    console.log("Parsing IF statement")


  parseElseStatement: (tokens) ->
    console.log("Parsing ELSE statement")

  parseEndStatement: (tokens) ->
    console.log("Parsing END statement")
