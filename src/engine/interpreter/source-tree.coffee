class SourceTree
  constructor: (@language) ->
    @tokenizer = new Tokenizer(@language)

    @statementParser =
      "#{@language.statement.SingleLineComment}": @parseSingleLineComment
      "#{@language.statement.MultiLineComment}": @parseMultiLineComment
      "#{@language.statement.If}": (tokens) => @parseIfStatement(tokens)
      "#{@language.statement.Else}": (tokens) => @parseElseStatement(tokens)
      "#{@language.statement.End}": (tokens) => @parseEndStatement(tokens)

  build: (files) ->
    @buildFromLines(file) for file in files

  buildFromLines: (lines) ->

    # Tokenize lines
    allTokens = @tokenizer.tokenizeLines(lines)

    # Reset tree
    sourceTree = new TreeNode()

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
      parsedStatement = parseFunction(tokens)
      console.log(parsedStatement)

  parseExpression: (tokens) ->
    return tokens

  parseSingleLineComment: (tokens) ->

  parseMultiLineComment: (tokens) ->

  parseIfStatement: (tokens) ->
    console.log("Parsing IF statement")

    # Find THEN token
    [thenIndex, thenToken] = @tokenizer.findTokenForwards(@language.tokenType.Then, tokens)
    if not thenIndex?
      return new ParseError(type = 'Syntax Error', message = 'Expected THEN')

    # Find ELSE token, if any
    [elseIndex, elseToken] = @tokenizer.findTokenBackwards(@language.tokenType.Else, tokens, thenIndex + 1)

    # Parse test expression
    testTokens = tokens[1...thenIndex]
    testExpression = @parseExpression(testTokens)
    if testExpression instanceof ParseError
      return testExpression

    # Find THEN statement, if any
    thenEndIndex = if elseIndex? then elseIndex else tokens.length
    thenTokens = tokens[(thenIndex + 1)...thenEndIndex]

    # Multiline IF statement
    if thenTokens.length == 0
      return new IfNode(testTree = testExpression)

    # Parse THEN expression
    thenExpression = @parseExpression(thenTokens)
    if thenExpression instanceof ParseError
      return thenExpression

    # IF THEN ELSE statement
    if elseIndex?

      # Find ELSE statement
      elseTokens = tokens[(elseIndex + 1)...tokens.length]
      if elseTokens.length == 0
        return new ParseError(type = 'Syntax Error', message = 'Expected expression after ELSE')

      # Parse ELSE expression
      elseExpression = @parseExpression(elseTokens)
      if elseExpression instanceof ParseError
        return elseExpression

      return new IfNode(testTree = testExpression, thenTree = thenExpression, elseIfTrees = undefined, elseTree = elseExpression)

    # IF THEN statement
    return new IfNode(testTree = testExpression, thenTree = thenExpression)

  parseElseStatement: (tokens) ->
    console.log("Parsing ELSE statement")

  parseEndStatement: (tokens) ->
    console.log("Parsing END statement")



class TreeNode
  constructor: ->
    @parent = undefined

class IfNode extends TreeNode
  constructor: (@testTree, @thenTree, @elseIfTrees = undefined, @elseTree = undefined) ->

class TreeExpression extends TreeNode

class TreeLeaf extends TreeNode

class ParseError extends TreeNode
  constructor: (@type, @message, @example = undefined) ->
