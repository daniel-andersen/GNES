# Language basics

## Variables

    <name> = <expr>

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

    property <name> [= <expr>]

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

    continue

    break

## Coroutines

    start coroutine <function_name> => id

    stop coroutine with id <id>
    stop all coroutines

## Logical operators

    and
    or
    not
    is
    ==
    !=

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



# Examples

## Language basics

    if x is y and y is not z then ...
    if x == y and y != z then ...
    if x < y or y < z then ...
    if x then ...
    if not x then ...

    class Test
        property name
        property age = 17

        function something()
            if name is "Daniel" and age < 20 then
                ...
            end
        end
    end
