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
      Continue: 26
      Break: 27
      Class: 28
      Function: 29
      Of: 30
      Type: 31

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
      'continue': @tokenType.Continue
      'break': @tokenType.Break
      'class': @tokenType.Class
      'function': @tokenType.Function
      'of': @tokenType.Of
      'type': @tokenType.Type
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
      Continue: 7
      Break: 8
      Class: 9
      Function: 10




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
      @tokenType.Continue
      @tokenType.Break
      @tokenType.Class
      @tokenType.Function
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

    @statements =
      "#{@statementType.SinglelineIf}": [
        {type: "token", token: @tokenType.If}
        {type: "expression", id: "expression"}
        {type: "token", token: @tokenType.Then}
        {type: "statement", id: "then"}
        {type: "group", required: false, group: [
          {type: "token", token: @tokenType.Else}
          {type: "statement", id: "else"}
        ]}
        {type: "token", token: @tokenType.EOL}
      ]
      "#{@statementType.MultilineIf}": [
        {type: "token", token: @tokenType.If}
        {type: "expression", id: "expression"}
        {type: "token", token: @tokenType.Then}
        {type: "token", token: @tokenType.EOL}
        {type: "subtree", id: "then"}
        {type: "group", required: false, group: [
          {type: "token", token: @tokenType.Else}
          {type: "token", token: @tokenType.EOL}
          {type: "subtree", id: "else"}
        ]}
        {type: "token", token: @tokenType.End}
      ]
      "#{@statementType.SinglelineWhile}": [
        {type: "token", token: @tokenType.While}
        {type: "expression", id: "expression"}
        {type: "token", token: @tokenType.Do}
        {type: "statement", id: "do"}
        {type: "token", token: @tokenType.EOL}
      ]
      "#{@statementType.MultilineWhile}": [
        {type: "token", token: @tokenType.While}
        {type: "expression", id: "expression"}
        {type: "token", token: @tokenType.Do}
        {type: "token", token: @tokenType.EOL}
        {type: "subtree", id: "do"}
        {type: "token", token: @tokenType.End}
      ]
      "#{@statementType.For}": [
        {type: "token", token: @tokenType.For}
        {type: "token", token: @tokenType.Variable, id: "variable"}
        {type: "token", token: @tokenType.In}
        {type: "expression", id: "expression"}
        {type: "token", token: @tokenType.Do}
        {type: "subtree", id: "do"}
        {type: "token", token: @tokenType.End}
      ]
      "#{@statementType.Assignment}": [
        {type: "token", token: @tokenType.Variable, id: "variable"}
        {type: "token", token: @tokenType.Assignment}
        {type: "expression", id: "expression"}
      ]
      "#{@statementType.Continue}": [
        {type: "token", token: @tokenType.Continue}
      ]
      "#{@statementType.Break}": [
        {type: "token", token: @tokenType.Break}
      ]
      "#{@statementType.Class}": [
        {type: "token", token: @tokenType.Class}
        {type: "token", token: @tokenType.Variable, id: "className"}
        {type: "group", required: false, group: [
          {type: "token", token: @tokenType.Of}
          {type: "token", token: @tokenType.Type}
          {type: "token", token: @tokenType.Variable, id: "ofTypeName"}
        ]}
        {type: "token", token: @tokenType.EOL}
        {type: "subtree", id: "content"}
        {type: "token", token: @tokenType.End}
      ]
