# Language basics

## Variables

    <name> = <expr>

## If/then/else

    If <expr> Then <expr> [Else expr]

    If <expr> Then
    [Else If <expr> Then]
    [Else]
    End

## Functions

    Function <name>([<name>, ...])
    End

    <name>([<name>=<expr>, ...])

    Return [<expr>]

## Classes

    Class <name> [Of Type <name>]
        Property <name> [= <expr>]
        Behaviour <name> Of Type <name>
    End

## Arrays

    [<expr>, ...]

## Dictionaries

    {key: <expr>, ...}

## Loops

    For <name> In <expr> Do
    End

    For <key>, <value> In <expr> Do
    End

    For <name> From <expr> To <expr> [Step By <expr>] Do
    End

    While <expr> Do
    End

    Repeat
    Until <expr>

    Continue

    Break

## Coroutines

    Start coroutine <function_name> => id

    Stop Coroutine With Id <id>
    Stop All Coroutines

## Logical operators

    And
    Or
    Not
    Is
    ==
    !=

## Comments

    # Comment

    ###
    Multiline comment
    ###

# Specific functionality

## Maps

    <name> = Load Map(<filename>)

    Show Map <id>
    Hide Map <id>

## Layers

    add map layer with [id <id> and] <filename> to index <index> => id
    add empty map layer [with id <id>] to index <index> => id

    remove layer <id>

    show layer <id>
    hide layer <id>

    move layer <id> from index <index> to <index>

## Sprites

    <name> = Load Sprite(<filename>)

    Add Sprite <expr> [To Layer <expr>]
    Remove Sprite <expr>

    Show Sprite <expr>
    Hide Sprite <expr>

    Bring Sprite <expr> To Front
    Bring Sprite <expr> To Back



# Examples

## Language basics

    If x Is y And y Is Not z Then ...
    If x == y And y != z Then ...
    If x < y Or y < z Then ...
    If x Then ...
    If Not x Then ...

    Class Test
        Property name
        Property age = 17

        Function something()
            If name Is "Daniel" And age < 20 Then
                ...
            End
        End
    End
