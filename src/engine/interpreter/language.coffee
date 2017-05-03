ExpressionType =
  variable: -1
  singleLineComment: 0
  multiLineComment: 1
  andOperator: 2
  orOperator: 3
  equalOperator: 4
  notEqualOperator: 5
  negationOperator: 6
  plusOperator: 7
  minusOperator: 8
  multiplyOperator: 9
  divideOperator: 10
  assignmentOperator: 11
  ifOperator: 12
  thenOperator: 13
  elseOperator: 14
  endOperator: 15

class Language

  constructor: ->

    @tokenTypes =
      '#': ExpressionType.singleLineComment
      '###': ExpressionType.multiLineComment
      'and': ExpressionType.andOperator
      'or': ExpressionType.orOperator
      '==': ExpressionType.equalOperator
      'is': ExpressionType.equalOperator
      '!=': ExpressionType.notEqualOperator
      'is not': ExpressionType.notEqualOperator
      'not': ExpressionType.negationOperator
      '+': ExpressionType.plusOperator
      '-': ExpressionType.minusOperator
      '*': ExpressionType.multiplyOperator
      '/': ExpressionType.divideOperator
      '=': ExpressionType.assignmentOperator
      'if': ExpressionType.ifOperator
      'then': ExpressionType.thenOperator
      'else': ExpressionType.elseOperator
      'end': ExpressionType.endOperator
