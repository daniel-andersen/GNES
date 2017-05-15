globals = this
globals.scope = new Scope()
globals.mainThread = new Thread()

if false
  globals.mainThread.setVariable(new Variable("test", "Hello world!"))
  console.log("---> " + globals.mainThread.resolveVariable("test").value)

  globals.mainThread.pushEncapsulatedScope().setVariable(new Variable("test", "Hello solar system!"))
  console.log("---> " + globals.mainThread.resolveVariable("test").value)

  globals.mainThread.pushLocalScope().setVariable(new Variable("test", "Hello universe!"))
  console.log("---> " + globals.mainThread.resolveVariable("test").value)

  globals.mainThread.popLocalScope()
  console.log("---> " + globals.mainThread.resolveVariable("test").value)

  globals.mainThread.popEncapsulatedScope()
  console.log("---> " + globals.mainThread.resolveVariable("test").value)

if false
  language = new Language()
  tokenizer = new Tokenizer(language)
  console.log(tokenizer.tokenizeLines(['if a is 123 then a = "THIS IS A TEST" else 2']))

if true
  lines = [
    [
      '###'
      'This is a multiline comment'
      '###'
      'if x == 5 then str = "x equals 5" else str = "x does not equal 5"'
      'if str is "x equals 5" then   # This is a comment'
      '  print("x equals 5")'
      'else'
      '  print("x does not equal 5")'
      'end'
    ]
  ]

  lines = [
    [
      'for x in (2 + y) do'
      '  f(x)'
      'end'
      'while a == 1 do'
      '  x = 1'
      '  if a == 2 then'
      '    x = 2'
      '    y = 3'
      '  else'
      '    z = 3 + "TEST"'
      '  end'
      'end'
      ''
      'a = "test"'
    ]
  ]

  language = new Language()
  sourceTree = new SourceTree(language)
  sourceTree.build(lines)
