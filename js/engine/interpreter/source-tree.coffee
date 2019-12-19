class SourceTree
  self = undefined

  constructor: (@language) ->
    self = @

    @tokenizer = new Tokenizer(@language)

  build: (files) ->
    @buildFromLines(file) for file in files

  buildFromLines: (lines) ->

    # Tokenize lines
    tokens = @tokenizer.tokenizeLines(lines)

    # Parse tokens
    block = @parseBlock(tokens)

    console.log("---------")
    console.log("Result:")
    console.log(block)
    console.log("---------")

  parseBlock: (tokens) ->

    blockNode = new BlockNode()

    # Parse nodes
    while tokens.length > 0
      node = @parse(tokens)
      if not node?
        return blockNode

      # Add node
      blockNode.nodes.push(node)
      blockNode.tokens = blockNode.tokens.concat(node.tokens)

      # Remove tokens
      tokens = tokens[node.tokens.length..]

    return blockNode

  parse: (tokens) ->

    # No tokens left
    if tokens.length == 0 or tokens[0].type == @language.tokenType.EOF
      return undefined

    # Newline
    if tokens[0].type == @language.tokenType.EOL
      return new NewlineNode([tokens[0]])

    # Parse statement
    statement = @parseStatement(tokens)
    if statement?
      return statement

    # Parse expression
    expression = @parseExpression(tokens)
    if expression?
      return expression

    return undefined

  parseStatement: (tokens) ->

    # Match all statements
    for type of @language.statements
      statement = @matchStatement(@language.statements[type], tokens, type)
      if statement?
        return statement

    return undefined

  parseExpression: (tokens) ->

    # Find end of expression (= any statement token)
    expressionTokens = []
    while tokens.length > 0 and !@language.statementTokens.includes(tokens[0].type) and tokens[0].type != @language.tokenType.EOL and tokens[0].type != @language.tokenType.EOF
      expressionTokens.push(tokens[0])
      tokens = tokens[1..]

    if expressionTokens.length > 0
      return new ExpressionNode(expressionTokens)

    return undefined

  matchStatement: (statement, tokens, type) ->
    position = 0

    matchedNodes = []
    matchedTokens = []

    tokens = tokens[..]

    # Match statement
    while position < statement.length

      # Check any tokens left
      if tokens.length <= 0
        return undefined

      # Match entry
      entry = statement[position]
      node = @matchEntry(entry, tokens)

      if not node?
        return undefined

      tokens = tokens[node.tokens.length..]

      matchedNodes.push(node)
      matchedTokens = matchedTokens.concat(node.tokens)

      position += 1

    return new StatementNode(matchedTokens, matchedNodes, type)

  matchEntry: (entry, tokens) ->
    return switch entry['type']
      when 'token' then @matchTokenEntry(entry, tokens)
      when 'expression' then @matchExpressionEntry(entry, tokens)
      when 'statement' then @matchStatementEntry(entry, tokens)
      when 'group' then @matchGroupEntry(entry, tokens)
      when 'subtree' then @matchSubtreeEntry(entry, tokens)
      else undefined

  matchTokenEntry: (entry, tokens) ->
    if 'token' of entry
      if tokens[0].type == entry['token']
        return new TokenNode([tokens[0]], tokens[0])
    if 'tokens' of entry
      if tokens[0].type in entry['tokens']
        return new TokenNode([tokens[0]], tokens[0])
    return undefined

  matchExpressionEntry: (entry, tokens) ->
    expressionNode = @parseExpression(tokens)
    if expressionNode instanceof ExpressionNode
      return expressionNode
    return undefined

  matchStatementEntry: (entry, tokens) ->
    statementNode = @parseStatement(tokens)
    if statementNode instanceof StatementNode
      return statementNode
    return undefined

  matchGroupEntry: (entry, tokens) ->
    statement = @matchStatement(entry['group'], tokens)
    if statement?
      return new GroupNode(statement.tokens, statement)

    required = if 'required' of entry then entry['required'] else true
    if not required
      return new GroupNode()

    return undefined

  matchSubtreeEntry: (entry, tokens) ->
    blockNode = @parseBlock(tokens)
    if blockNode?
      return blockNode

    required = if 'required' of entry then entry['required'] else true
    if not required
      return new BlockNode()

    return undefined



  class Node
    constructor: (@tokens) ->

  class TokenNode extends Node
    constructor: (@tokens=[], @token) ->
      super(@tokens)

  class StatementNode extends Node
    constructor: (@tokens=[], @nodes=[], @type=undefined) ->
      super(@tokens)

  class ExpressionNode extends Node

  class BlockNode extends Node
    constructor: (@tokens=[], @nodes=[]) ->
      super(@tokens)

  class GroupNode extends Node
    constructor: (@tokens=[], @node=undefined) ->
      super(@tokens)

  class NewlineNode extends Node
    constructor: (@tokens=[]) ->
      super(@tokens)




















#
