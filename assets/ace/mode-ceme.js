ace.define('ace/mode/ceme', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var ExampleHighlightRules = require("ace/mode/example_highlight_rules").ExampleHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new ExampleHighlightRules().getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    // Extra logic goes here. (see below)
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define('ace/mode/example_highlight_rules', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var ExampleHighlightRules = function() {

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
   this.$rules = {
        "start" : [
            {
                token: "comment",
                regex: "#.*$",
            },
            {
                token: "keyword",
                regex: "function|define|list",
            },
            {
                token: "string",
                regex: /"""/,
                next: "longstring"
            },
            {
                token: "string",
                regex: /'''/,
                next: "longstring"
            },
            {
                token: "string",
                regex: /"(?:\\["'\\\/bfnrt]|[^\\"\n\r])*"/,
            },
            {
                token: "string",
                regex: /'(?:\\["'\\\/bfnrt]|[^\\'\n\r])*'/,
            },
            {
                token: "constant.numeric",
                regex: /-?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][+-]?[0-9]*)?/,
            },
            {
                token: "constant.language",
                regex: 'true|false',
            },
            {
                token: "support.function",
                regex: 'h1|h2|h3|h4|h5|h6|p|ul|li',
            },
            {
                token: "identifier",
                regex: /[a-zA-Z0-9]+/,
            },
        ],
        "longstring": [
            {
                token: "string",
                regex: /"""/,
                next: "start",
            },
            {
                token: "string",
                regex: /'''/,
                next: "start",
            },
            {
                token: "string",
                regex: /([^"]|\\")|([^']|\\')/,
            },
        ]
    };

}

oop.inherits(ExampleHighlightRules, TextHighlightRules);

exports.ExampleHighlightRules = ExampleHighlightRules;
});
