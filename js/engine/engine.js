import Language from './interpreter/language'
import Tokenizer from './interpreter/tokenizer'
import { SourceTree } from './interpreter/source-tree'
import { Scope } from './model/scope'
import { Thread } from './thread/thread'
import { Variable } from './model/variable'

export default class Engine {
    constructor() {
        this.globals = {}
        this.globals.scope = new Scope()
        this.globals.mainThread = new Thread()
    }

    testVariables() {
        this.globals.mainThread.setVariable(new Variable("test", "Hello world!"))
        console.log("---> " + this.globals.mainThread.resolveVariable("test").value)

        this.globals.mainThread.pushEncapsulatedScope().setVariable(new Variable("test", "Hello solar system!"))
        console.log("---> " + this.globals.mainThread.resolveVariable("test").value)

        this.globals.mainThread.pushLocalScope().setVariable(new Variable("test", "Hello universe!"))
        console.log("---> " + this.globals.mainThread.resolveVariable("test").value)

        this.globals.mainThread.popLocalScope()
        console.log("---> " + this.globals.mainThread.resolveVariable("test").value)

        this.globals.mainThread.popEncapsulatedScope()
        console.log("---> " + this.globals.mainThread.resolveVariable("test").value)
    }

    testTokenizer() {
        const language = new Language()
        const tokenizer = new Tokenizer(language)
        console.log(tokenizer.tokenizeLines(['if a is 123 then a = "THIS IS A TEST" else 2']))
    }

    testParser(index) {
        const lines = [

            // 1
            [
                [
                    '###',
                    'This is a multiline comment',
                    '###',
                    'if x == 5 then str = "x equals 5" else str = "x does not equal 5"',
                    'if str is "x equals 5" then   # This is a comment',
                    '    print("x equals 5")',
                    'else',
                    '    print("x does not equal 5")',
                    'end'
                ]
            ],

            // 2
            [
                [
                    'for x in (2 + y) do',
                    '    f(x)',
                    'end',
                    'while a == 1 do',
                    '    x = 1',
                    '    if a == 2 then',
                    '        x = 2',
                    '        y = 3',
                    '        continue',
                    '    else',
                    '        z = 3 + "TEST"',
                    '        break',
                    '    end',
                    'end',
                    '',
                    'a = "test"'
                ]
            ],

            // 3
            [
                [
                    'while x > 10 do',
                    '    if x > 8 then x = 2 else y = 2',
                    '    if x > 0 then',
                    '        y = 3',
                    '    end',
                    '    y = 2',
                    '    z = 3',
                    'end',
                    'b = 10 + 20',
                    'c = 30 + 40',
                    'if a == 1 then y = 2 else z = 3',
                    'if a == 1 then',
                    '    b = 1',
                    '    c = 2 + 3',
                    'else',
                    '    d = 4',
                    'end'
                ]
            ],

            // 4
            [
                [
                    'class Test of type XYZ',
                    '    f(x)',
                    '    g(y)',
                    '    h(z)',
                    '    x = 2',
                    'end'
                ]
            ],

            // 5
            [
                [
                    'f(name="test af GNES!", country="Denmark", code=2*3)',
                    'for x in f(x=2) do',
                    '    x = 2',
                    '    break',
                    'end',
                    'while x > 10 do',
                    '   f(x=y*2)',
                    '   g(x=3+y)',
                    'end',
                    'do',
                    '   f(x=0)',
                    '   g(x=1)',
                    'until x > 20',
                    'if x > 2 then',
                    '    x = 2',
                    'else',
                    '    y = 2',
                    'end',
                    'x = 2 + 3',
                    'f(test=x * 1 + 2)',
                    '12 + (f(name=x+23) + 24 * 35) * 456'
                ]
            ]
        ]

        const language = new Language()
        const sourceTree = new SourceTree(language)
        sourceTree.build(lines[index])
    }
}

Engine.sharedInstance = new Engine()
