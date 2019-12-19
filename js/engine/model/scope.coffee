class EncapsulatedScope

  constructor: ->
    @scopes = []
    @pushScope()

  pushScope: ->
    scope = new Scope()
    @scopes.push(scope)
    return scope

  popScope: -> @scopes.pop()

  currentScope: -> @scopes[@scopes.length - 1]

  setVariable: (variable) ->
    ###
    Sets the given variable in the appropriate scope.
    ###

    # Get existing variable (in any scope)
    currentVariable = @resolveVariable(variable)

    # Overwrite variable if it already exists
    if currentVariable?
      currentVariable.value = variable.value

    # Create new variable in current scope
    else
      @currentScope().setVariable(variable)

  resolveVariable: (name) ->
    ###
    Resolves a variable with the given name in the current scope.
    ###

    # Run backwards through local scopes
    for scope in @scopes by -1
      variable = scope.resolveVariable(name)
      if variable?
        return variable

    # Not found
    return undefined


class Scope

  constructor: ->
    @variables = {}

  setVariable: (variable) ->
    @variables[variable.name] = variable

  resolveVariable: (name) ->
    return if name of @variables then @variables[name] else undefined
