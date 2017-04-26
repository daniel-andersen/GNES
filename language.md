# Language basics

## If/then/else

    if <expr> then <expr> [else expr]

    if <expr> then
    [else if <expr> then]
    [else]
    end

## Functions

    function <name>(<parameter>, ...)
    end

    <name>(<expr>, ...)

## Classes

    class <name> [of type <name>]
    end

## Arrays

    [<expr>, ...]

## Dictionaries

    {key: <expr>, ...}

## Loops

    for <name> in <expr> do
    end

    for <key>, <value> in <expr> do
    end

    while <expr> do
    end

    do
    while <expr>

    continue

    break



# Specific functionality

## Maps

    load map with filename <filename>

## Layers

    add map layer with [id <id> and] <filename> to index <index> => id
    add empty map layer [with id <id>] to index <index> => id

    remove layer with id <id>

    show layer with id <id>
    hide layer with id <id>

    move layer with id <id> from index <index> to <index>

## Coroutines

    start coroutine <function_name> => id

    stop coroutine with id <id>
    stop all coroutines

## Comments

    # Comment

    ###
    Multiline comment
    ###
