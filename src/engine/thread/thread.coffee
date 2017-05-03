class Thread

  constructor: ->
    @uuid = UuidUtil.uuid()
    @scopeStack = []

    # Push thread scope
    @pushEncapsulatedScope()

  pushLocalScope: -> @currentEncapsulatedScope().pushScope(scope)

  popLocalScope: -> @currentEncapsulatedScope().popScope()

  currentLocalScope: -> @currentEncapsulatedScope().currentScope()

  pushEncapsulatedScope: ->
    scope = new EncapsulatedScope()
    @scopeStack.push(scope)
    return scope

  popEncapsulatedScope: -> @scopeStack.pop()

  currentEncapsulatedScope: -> @scopeStack[@scopeStack.length - 1]

  setVariable: (variable) ->
    @currentLocalScope().setVariable(variable)

  resolveVariable: (name) ->
    ###
    Resolves a variable with the given name in the current thread.
    ###

    # Resolve in current scope
    variable = @currentEncapsulatedScope().resolveVariable(name)
    if variable?
      return variable

    # Resolve in global scope
    variable = globals.scope.resolveVariable(name)
    if variable?
      return variable

    # Not found
    return undefined
