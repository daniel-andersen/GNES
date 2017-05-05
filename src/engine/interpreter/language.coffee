class Language

  constructor: ->

    @tokenType =
      Any: -2
      Variable: -1
      SingleLineComment: 0
      MultiLineComment: 1
      And: 2
      Or: 3
      Equal: 4
      NotEqual: 5
      Negation: 6
      Plus: 7
      Minus: 8
      Multiply: 9
      Divide: 10
      Assignment: 11
      If: 12
      Then: 13
      Else: 14
      End: 15
      ParenthesesStart: 16
      ParenthesesEnd: 17
      StringDelimiter: 18
      StringConstant: 19

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
      '"': @tokenType.StringDelimiter

    @statement =
      SingleLineComment: 0
      MultiLineComment: 1
      Assignment: 2
      If: 3
      IfThenElse: 4
      Else: 5
      ElseIf: 6
      End: 7

    @statementStart =
      "#{@tokenType.SingleLineComment}": @statement.SingleLineComment
      "#{@tokenType.MultiLineComment}": @statement.MultiLineComment
      "#{@tokenType.If}": @statement.If
      "#{@tokenType.Else}": @statement.Else
      "#{@tokenType.End}": @statement.End
