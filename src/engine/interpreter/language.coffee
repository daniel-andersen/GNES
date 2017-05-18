class Language

  constructor: ->

    @tokenType =
      EOF: -2
      EOL: -1
      Variable: 0
      Number: 1
      SingleLineComment: 2
      MultiLineComment: 3
      And: 4
      Or: 5
      Equal: 6
      NotEqual: 7
      Negation: 8
      Plus: 9
      Minus: 10
      Multiply: 11
      Divide: 12
      Assignment: 13
      If: 14
      Then: 15
      Else: 16
      End: 17
      While: 18
      Do: 19
      For: 20
      In: 21
      ParenthesisStart: 22
      ParenthesisEnd: 23
      StringDelimiter: 24
      StringConstant: 25

    @tokenTypes =
      '#': @tokenType.SingleLineComment
      '###': @tokenType.MultiLineComment
      'and': @tokenType.And
      'or': @tokenType.Or
      '==': @tokenType.Equal
      'is': @tokenType.Equal
      '!=': @tokenType.NotEqual
      'not': @tokenType.Negation
      '+': @tokenType.Plus
      '-': @tokenType.Minus
      '*': @tokenType.Multiply
      '/': @tokenType.Divide
      '=': @tokenType.Assignment
      'if': @tokenType.If
      'then': @tokenType.Then
      'else': @tokenType.Else
      'end': @tokenType.End
      'while': @tokenType.While
      'do': @tokenType.Do
      'for': @tokenType.For
      'in': @tokenType.In
      '(': @tokenType.ParenthesisStart
      ')': @tokenType.ParenthesisEnd
      '"': @tokenType.StringDelimiter

    @statementType =
      SinglelineIf: 0
      MultilineIf: 1
      SinglelineWhile: 2
      MultilineWhile: 3
      For: 4
      Assignment: 5
      Expression: 6




    @statementTokens = [
      @tokenType.SingleLineComment
      @tokenType.MultiLineComment
      @tokenType.Assignment
      @tokenType.If
      @tokenType.Then
      @tokenType.Else
      @tokenType.End
      @tokenType.While
      @tokenType.Do
      @tokenType.For
      @tokenType.In
    ]

    @arithmeticTokens = [
      @tokenType.And
      @tokenType.Or
      @tokenType.Plus
      @tokenType.Minus
      @tokenType.Multiply
      @tokenType.Divide
      @tokenType.Equal
      @tokenType.NotEqual
      @tokenType.Not
    ]

    @arithmeticOperationPriority =
      "#{@tokenType.And}": 6
      "#{@tokenType.Or}": 5
      "#{@tokenType.Multiply}": 4
      "#{@tokenType.Divide}": 3
      "#{@tokenType.Plus}": 2
      "#{@tokenType.Minus}": 2
      "#{@tokenType.Equal}": 1
      "#{@tokenType.NotEqual}": 1
      "#{@tokenType.Not}": 0
