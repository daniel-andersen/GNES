import * as CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'

export default class CodeMirrorBasicMode {
    static define() {
        CodeMirror.defineSimpleMode("gnes-basic", {
            // The start state contains the rules that are intially used
            start: [

                // The regex matches the token, the token property contains the type
                {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},

                // You can match multiple tokens at once. Note that the captured
                // groups must span the whole string in this case
                {regex: /(function)(\s+)([a-z$][\w$]*)/, token: ["keyword", null, "variable-2"]},

                // Rules are matched in the order in which they appear, so there is
                // no ambiguity between this one and the one above
                // indent and dedent properties guide autoindentation
                {regex: /(?:Class|Function|Behaviour|While|Do|Repeat|If|Then|Else|For|Constructor|Update)\b/, token: "keyword", indent: true},
                {regex: /(?:End|Until)\b/, token: "keyword", dedent: true},

                {regex: /(?:Of|Type|End|Property|Return|New|Print|Break|Continue|From|To|Step|By|Load|Sprite|Invoke|In|Shared|Wait|And|Or)\b/, token: "keyword"},
                {regex: /True|False|Undefined/, token: "atom"},
                {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "number"},
                {regex: /\/\/.*/, token: "comment"},
                {regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3"},

                // A next property will cause the mode to move to a different state
                {regex: /###/, token: "comment", next: "comment"},
                {regex: /[-+\/*=<>!]+/, token: "operator"},

                {regex: /[A-Z$][\w$]*/, token: "type"},
                {regex: /[a-z$][\w$]*/, token: "variable"},
            ],
            // The multi-line comment state.
            comment: [
                {regex: /.*?###/, token: "comment", next: "start"},
                {regex: /.*/, token: "comment"}
            ],
            // The meta property contains global information about the mode. It
            // can contain properties like lineComment, which are supported by
            // all modes, and also directives like dontIndentStates, which are
            // specific to simple modes.
            meta: {
                dontIndentStates: ["comment"],
                lineComment: "#"
            }
        })
    }
}
