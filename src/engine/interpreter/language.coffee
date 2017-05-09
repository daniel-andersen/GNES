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
      ParenthesisStart: 18
      ParenthesisEnd: 19
      StringDelimiter: 20
      StringConstant: 21

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
      '(': @tokenType.ParenthesisStart
      ')': @tokenType.ParenthesisEnd
      '"': @tokenType.StringDelimiter

    @statementTokens = [
      @tokenType.SingleLineComment
      @tokenType.MultiLineComment
      @tokenType.Assignment
      @tokenType.If
      @tokenType.Then
      @tokenType.Else
      @tokenType.End
    ]

    @statementType =
      SingleLineComment: 0
      MultiLineComment: 1
      Assignment: 2
      If: 3
      IfThenElse: 4
      Else: 5
      ElseIf: 6
      End: 7
