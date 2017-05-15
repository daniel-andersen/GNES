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
      "#{@language.tokenType.While}": [
        {
          startTokens: [@language.tokenType.While]
          nodeClass: WhileNode
        }
      ]
      "#{@language.tokenType.Do}": [
        {
          startTokens: [@language.tokenType.Do]
          nodeClass: DoNode
        }
      ]
      "#{@language.tokenType.For}": [
        {
          startTokens: [@language.tokenType.For]
          nodeClass: ForNode
        }
      ]
      "#{@language.tokenType.In}": [
        {
          startTokens: [@language.tokenType.In]
          nodeClass: InNode
        }
      ]
      "#{@language.tokenType.Variable}": [
        {
          startTokens: [@language.tokenType.Variable, @language.tokenType.Assignment]
          nodeClass: AssignmentNode
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

  buildNode: (tokens, nodeClass) ->

    # End of file
    if tokens.length == 0
      return [new EOFNode(), []]

    # Find node statement class
    if not nodeClass?
      nodeClass = @findStatementNodeClass(tokens)

    # Find node expression class
    if not nodeClass?
      nodeClass = @findExpressionNodeClass(tokens)

    if not nodeClass?
      return [new ParseError(type = 'Syntax Error', message = 'Unexpected keyword "' + tokens[0] + '"'), []]

    # Build node
    node = new nodeClass()
    tokens = node.build(tokens)
    return [node, tokens]

  buildStatement: (tokens, nodeClass = undefined) ->
    if not nodeClass?
      nodeClass = @findStatementNodeClass(tokens)

    if not nodeClass?
      return [new ParseError(type = 'Syntax Error', message = 'Unexpected keyword "' + tokens[0] + '"'), []]

    node = new nodeClass()
    remainingTokens = node.build(tokens)
    return [node, remainingTokens]

  buildExpression: (tokens, nodeClass = undefined) ->
    if not nodeClass?
      nodeClass = @findExpressionNodeClass(tokens)

    if not nodeClass?
      return [new ParseError(type = 'Syntax Error', message = 'Unexpected keyword "' + tokens[0] + '"'), []]

    node = new nodeClass()
    remainingTokens = node.build(tokens)
    return [node, remainingTokens]

  findNodeClass: (tokens) ->

    # End of file
    if tokens.length == 0
      return EOFNode

    # Find statement class
    nodeClass = @findStatementNodeClass(tokens)
    if nodeClass?
      return nodeClass

    # Parse expression
    return @findExpressionNodeClass(tokens)

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

  nextToken: (tokens) ->
    while tokens.length > 0 and (tokens[0].type == @language.tokenType.EOL or tokens[0].type == @language.tokenType.EOF)
      tokens = tokens[1..]
    return if tokens.length > 0 then tokens[0] else @language.tokenType.EOF

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

        # Handle EOL
        tokens = @handleEOL(tokens)

        # Find node class
        remainingTokens = tokens

        nodeClass = self.findNodeClass(tokens)

        # Check if end node
        if nodeClass in endNodes
          return remainingTokens

        # Build node
        [node, tokens] = self.buildNode(tokens, nodeClass)
        if not node?
          break

        # Check if end of file reached
        if node instanceof EOFNode
          break

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

      # Build TEST expression
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

      # Check singleline IF THEN
      if @thenNode.singleline and self.nextToken(tokens).type not in [self.language.tokenType.Else, self.language.tokenType.End]
        return tokens

      @tokens = @tokens.concat(@thenNode.tokens)

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

          # Check singleline IF THEN ELSE
          if @thenNode.singleline and @elseNode.singleline and self.nextToken(tokens).type not in [self.language.tokenType.Else, self.language.tokenType.End]
            return tokens

        # END node
        else if node instanceof EndNode
          return tokens

        # Error
        else
          return new ParseError(type = 'Syntax Error', message = 'Expected END')

  class ThenNode extends BlockNode
    constructor: ->
      super()
      @singleline = false

    build: (tokens) ->

      # Consume THEN token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Check singleline vs multiline
      @singleline = tokens[0].type != self.language.tokenType.EOL

      # Singleline THEN
      if @singleline
        @singleline = true

        [node, tokens] = self.buildStatement(tokens)
        @children.push(node)

        @tokens = @tokens.concat(node.tokens)

        return tokens

      # Multiline THEN
      else
        return super(tokens, endNodes = [ElseIfNode, ElseNode, EndNode])

  class ElseIfNode extends TreeNode

  class ElseNode extends BlockNode
    constructor: ->
      super()
      @singleline = false

    build: (tokens) ->

      # Consume ELSE token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Check singleline vs multiline
      @singleline = tokens[0].type != self.language.tokenType.EOL

      # Singleline ELSE
      if @singleline
        @singleline = true

        [node, tokens] = self.buildStatement(tokens)
        @children.push(node)

        @tokens = @tokens.concat(node.tokens)

        return tokens

      # Multiline ELSE
      else
        return super(tokens, endNodes = [ElseIfNode, ElseNode, EndNode])

  class EndNode extends TreeNode

  class WhileNode extends TreeNode
    constructor: ->
      super()
      @testNode = undefined
      @doNode = undefined

    build: (tokens) ->

      # Consume WHILE token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build TEST expression
      [@testNode, tokens] = self.buildNode(tokens)
      if not @testNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      if not @testNode instanceof ExpressionNode
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      @tokens = @tokens.concat(@testNode.tokens)

      # Build DO node
      [@doNode, tokens] = self.buildNode(tokens)
      if not @doNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected DO')

      if not @doNode instanceof DoNode
        return new ParseError(type = 'Syntax Error', message = 'Expected DO')

      @tokens = @tokens.concat(@doNode.tokens)

      return tokens

  class DoNode extends BlockNode
    constructor: ->
      super()

    build: (tokens) ->

      # Consume DO token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build DO block
      tokens = super(tokens, endNodes = [EndNode])

      # Consume END token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      return tokens

  class ForNode extends TreeNode
    constructor: ->
      super()
      @variableNode = undefined
      @inNode = undefined
      @doNode = undefined

    build: (tokens) ->

      # Consume FOR token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build VARIABLE node
      @variableNode = new VariableNode()
      tokens = @variableNode.build(tokens)

      if not @variableNode instanceof VariableNode
        return new ParseError(type = 'Syntax Error', message = 'Expected variable')

      @tokens = @tokens.concat(@variableNode.tokens)

      # Build IN node
      [@inNode, tokens] = self.buildNode(tokens)
      if not @inNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      if not @inNode instanceof InNode
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      @tokens = @tokens.concat(@inNode.tokens)

      # Build DO node
      [@doNode, tokens] = self.buildNode(tokens)
      if not @doNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected DO')

      if not @doNode instanceof DoNode
        return new ParseError(type = 'Syntax Error', message = 'Expected DO')

      @tokens = @tokens.concat(@doNode.tokens)

      return tokens

  class InNode extends TreeNode
    constructor: ->
      super()
      @expressionNode = undefined

    build: (tokens) ->

      # Consume IN token
      @tokens.push(tokens[0])
      tokens = tokens[1..]

      # Build EXPRESSION node
      [@expressionNode, tokens] = self.buildNode(tokens)
      if not @expressionNode?
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      if not @expressionNode instanceof ExpressionNode
        return new ParseError(type = 'Syntax Error', message = 'Expected expression')

      @tokens = @tokens.concat(@expressionNode.tokens)

      return tokens

  class ExpressionNode extends TreeNode
    constructor: ->
      super()
      @children = []

    build: (tokens) ->

      # Find end of expression (= any statement token)
      while tokens.length > 0 and tokens[0].type not in self.language.statementTokens and tokens[0].type != self.language.tokenType.EOL
        @tokens.push(tokens[0])
        tokens = tokens[1..]

      expressionTokens = @tokens[..]

      # Remove start and end parenthesis, if any
      if tokens[0].type == self.language.tokenType.ParenthesisStart
        if tokens[-1..].type == self.language.tokenType.ParenthesisEnd
          return new ParseError(type = 'Syntax Error', message = 'Expected end parenthesis')
        expressionTokens = @tokens[1...-1]

      # ........ parse in SourceTree class! PlusNode, MinusNode, EqualNode, etc.
      for token in @tokens
        if token.type in self.language.arithmeticTokens
          console.log(token)

      return tokens

  class FunctionCallNode extends ExpressionNode
    build: (tokens) ->
      return super(tokens)

  class ArithmeticExpressionNode extends ExpressionNode
    build: (tokens) ->
      return super(tokens)

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

      # Build EXPRESSION node
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

  class EOFNode extends TreeNode

  class ParseError extends TreeNode
    constructor: (@type, @message, @example = undefined) ->
      super

  class InternalError extends TreeNode
    constructor: (@type, @message, @example = undefined) ->
      super
