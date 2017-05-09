class SourceTree
  self = undefined

  constructor: (@language) ->
    self = @

    @tokenizer = new Tokenizer(@language)

    @statementClasses =
      "#{@language.tokenType.If}": [
        {
          startTokens: [@language.tokenType.If]
          nodeClass: IfNode
        }
      ]
      "#{@language.tokenType.Then}": [
        {
          startTokens: [@language.tokenType.Then]
          nodeClass: ThenNode
        }
      ]
      "#{@language.tokenType.Else}": [
        {
          startTokens: [@language.tokenType.Else, @language.tokenType.If]
          nodeClass: ElseIfNode
        }, {
          startTokens: [@language.tokenType.Else]
          nodeClass: ElseNode
        }
      ]
      "#{@language.tokenType.End}": [
        {
          startTokens: [@language.tokenType.End]
          nodeClass: EndNode
        }
      ]
      "#{@language.tokenType.Variable}": [
        {
          startTokens: [@language.tokenType.Variable, @language.tokenType.Assignment]
          nodeClass: AssignmentNode
        }, {
          startTokens: [@language.tokenType.Variable, @language.tokenType.ParenthesisStart]
          nodeClass: FunctionCallNode
        }
      ]

  build: (files) ->
    @buildFromLines(file) for file in files

  buildFromLines: (lines) ->

    # Tokenize lines
    tokens = @tokenizer.tokenizeLines(lines)

    # Reset tree
    sourceTree = new TopLevelNode(tokens)
    sourceTree.build(tokens, endNodes = [EOFNode])

    console.log(sourceTree)

  buildNode: (tokens) ->

    # End of file
    if tokens.length == 0
      return [new EOFNode(), []]

    # Parse statement
    nodeClass = @findStatementNodeClass(tokens)
    if nodeClass?
      return @buildStatement(tokens, nodeClass)

    # Parse expression
    return @buildExpression(tokens)

  buildStatement: (tokens, nodeClass = undefined) ->
    if not nodeClass?
      nodeClass = @findStatementNodeClass(tokens)

    if not nodeClass?
      return new ParseError(type = 'Syntax Error', message = 'Expected statement, but found ' + tokens[0])

    node = new nodeClass()
    remainingTokens = node.build(tokens)
    return [node, remainingTokens]

  buildExpression: (tokens, nodeClass = undefined) ->
    if not nodeClass?
      nodeClass = @findExpressionNodeClass(tokens)

    if not nodeClass?
      return new ParseError(type = 'Syntax Error', message = 'Expected expression, but found ' + tokens[0])

    node = new nodeClass()
    remainingTokens = node.build(tokens)
    return [node, remainingTokens]

  findStatementNodeClass: (tokens) ->

    # Find valid statements based on first token
    statements = @statementClasses[tokens[0].type]
    if not statements?
      return undefined

    # Find tree node from statement list
    node = undefined

    for statement in statements
      if tokens.length < statement.startTokens.length
        continue

      # Check if tokens matches statement
      valid = true
      for i in [0...statement.startTokens.length]
        if statement.startTokens[i] != tokens[i].type
          valid = false
          break

      # Statement found
      if valid
        return statement.nodeClass

    # Not found
    return undefined

  findExpressionNodeClass: (tokens) ->
    return ExpressionNode  # TODO!



  class TreeNode
    constructor: (@parent = undefined)->
      @tokens = []

    build: (tokens) ->
      # Nothing to do - consume first token
      @tokens.push(tokens[0])
      return tokens[1..]

    handleEOL: (tokens) ->
      while tokens.length > 0 and (tokens[0].type == self.language.tokenType.EOL or tokens[0].type == self.language.tokenType.EOF)
        @tokens.push(tokens[0])
        tokens = tokens[1..]
      return tokens


  class BlockNode extends TreeNode
    constructor: ->
      super()
      @children = []

    build: (tokens, endNodes = []) ->
      while tokens.length > 0

        remainingTokens = tokens

        # Handle EOL
        tokens = @handleEOL(tokens)

        # Build node
        [node, tokens] = self.buildNode(tokens)
        if not node?
          break

        # Check if end of file reached
        if node instanceof EOFNode
          break

        # Check if stop nodes
        for endNode in endNodes
          if node instanceof endNode
            return remainingTokens

        # Add node
        @children.push(node)

        # Add tokens
        @tokens = @tokens.concat(node.tokens)

      return tokens

  class TopLevelNode extends BlockNode

  class IfNode extends TreeNode
    constructor: ->
      super()
      @testNode = undefined
      @thenNode = undefined
      @elseIfNodes = []
      @elseNode = undefined

    build: (tokens) ->

      # Consume IF token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build test expression
      [@testNode, tokens] = self.buildNode(tokens)
      if not @testNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      if not @testNode instanceof ExpressionNode
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      @tokens = @tokens.concat(@testNode.tokens)

      # Build THEN node
      [@thenNode, tokens] = self.buildNode(tokens)
      if not @thenNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected THEN')

      if not @thenNode instanceof ThenNode
        return new ParseError(type = 'Syntax Error', message = 'Expected THEN')

      # Build ELSE and ELSE IF
      while true

        # Handle EOL
        tokens = @handleEOL(tokens)

        # Build node
        [node, tokens] = self.buildNode(tokens)
        @tokens = @tokens.concat(node.tokens)

        # ELSE IF node
        if node instanceof ElseIfNode
          if @elseNode?
            return new ParseError(type = 'Syntax Error', message = 'Expected END, not ELSE IF')
          @elseIfNodes.push(node)

        # ELSE node
        else if node instanceof ElseNode
          @elseNode = node

        # END node
        else if node instanceof EndNode
          return tokens

        # Error
        else
          return new ParseError(type = 'Syntax Error', message = 'Expected END')

  class ThenNode extends BlockNode
    build: (tokens) ->

      # Consume THEN token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build statements
      return super(tokens, endNodes = [ElseIfNode, ElseNode, EndNode])

  class ElseIfNode extends TreeNode

  class ElseNode extends BlockNode
    build: (tokens) ->

      # Consume ELSE token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build statements
      return super(tokens, endNodes = [ElseIfNode, ElseNode, EndNode])

  class EndNode extends TreeNode

  class ExpressionNode extends TreeNode
    build: (tokens) ->
      while tokens.length > 0 and tokens[0].type not in self.language.statementTokens and tokens[0].type != self.language.tokenType.EOL
        @tokens.push(tokens[0])
        tokens = tokens[1..]
      return tokens

  class AssignmentNode extends TreeNode
    constructor: ->
      super()
      @variableNode = undefined
      @expressionNode = undefined

    build: (tokens) ->

      # Build VARIABLE node
      @variableNode = new VariableNode()
      tokens = @variableNode.build(tokens)

      @tokens = @tokens.concat(@variableNode.tokens)

      # Consume ASSIGNMENT node
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build expression node
      [@expressionNode, tokens] = self.buildNode(tokens)
      if not @expressionNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      if not @expressionNode instanceof ExpressionNode
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      @tokens = @tokens.concat(@expressionNode.tokens)

      return tokens

  class VariableNode extends TreeNode
    constructor: ->
      super()
      @name = undefined

    build: (tokens) ->
      @name = tokens[0]
      super(tokens)

  class FunctionCallNode extends TreeNode

  class EOFNode extends TreeNode

  class ParseError extends TreeNode
    constructor: (@type, @message, @example = undefined) ->
      super

  class InternalError extends TreeNode
    constructor: (@type, @message, @example = undefined) ->
      super
