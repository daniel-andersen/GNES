class UuidUtil
  @uuid: ->
    return @_S4() + @_S4() + '-' + @_S4() + '-' + @_S4() + '-' + @_S4() + '-' + @_S4() + @_S4() + @_S4()

  @_S4 = ->
    ((1 + Math.random()) * 0x10000 | 0).toString(16).substring 1
