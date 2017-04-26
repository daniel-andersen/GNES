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

## Coroutines

    start coroutine <function_name> => id

    stop coroutine with id <id>
    stop all coroutines

## Comments

    # Comment

    ###
    Multiline comment
    ###


# Specific functionality

## Maps

    load map with [<id> and] filename <filename> => id

    show map <id>
    hide map <id>

## Layers

    add map layer with [id <id> and] <filename> to index <index> => id
    add empty map layer [with id <id>] to index <index> => id

    remove layer <id>

    show layer <id>
    hide layer <id>

    move layer <id> from index <index> to <index>

## Sprites

    load sprite with [<id> and] filename <filename> => id

    add sprite <id> [to layer <id>]
    remove sprite <id>

    show sprite <id>
    hide sprite <id>

    move sprite <id> to front
    move sprite <id> to back
