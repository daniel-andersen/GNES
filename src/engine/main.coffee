globals = this
globals.scope = new Scope()
globals.mainThread = new Thread()

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

language = new Language()
tokenizer = new Tokenizer(language)
console.log(tokenizer.tokenizeLine("if a is 123 then 1 else 2"))
