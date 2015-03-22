/** Copyright 2014, Maxwel D'souza

 The information contained herein is the intellectual
 property of Maxwel D'souza. It is NOT property of any
 partnerships and/or companies owned by the author.
 Reproduction in any form is strictly prohibited unless
 prior written permission is obtained from the author.  */

"use strict";

var cemeEnv = {};
var ceme = function () {
    /*********************************************************************************************/
    /* General
    /*********************************************************************************************/
    // TODO move
    var platform  = function () {
        if (typeof XMLHttpRequest !== 'undefined') {
            return 'browser';
        } else if (typeof exports !== 'undefined') {
            return 'nodejs';
        }
    }

    // TODO move
    var lib;
    if (platform() === 'nodejs') {
        lib = require('./lib');
        cemeEnv = lib.cemeEnv;
    } else {
    }

    // TODO remove
    var evalInEnv = function (env, src) {
        if (platform() === 'nodejs') {
            return eval(src);
        } else {
            return eval(src);
        }
    };

    // TODO make safe
    var fetchFile = function (fileName) {
        if (platform() === 'nodejs') {
            var fs = require('fs');
            // transform root-relative web path to os path
            if (fileName.indexOf('/api') === 0 || fileName.indexOf('/data') === 0) {
                fileName = '..' + fileName;
            } else {
                fileName = '.' + fileName;
            }
            return fs.readFileSync(fileName, {encoding: 'utf8'});
        } else {
            return ajaxRequest(fileName);
        }
    }

    /*********************************************************************************************/
    /* Errors                                                                                    */
    /*********************************************************************************************/

    Array.prototype.swap = function (a, b) {
        var temp = this[a];
        this[a] = this[b];
        this[b] = temp;
        return this;
    }

    /*********************************************************************************************/
    /* Compiler                                                                               */
    /*********************************************************************************************/

    var compileAll = function (tree) {
        var input = '';
        var output = '';
        var tmp;
        var i;
        for (i = 0; i < tree.length; i++) {
            var code = _expression(_unbox(compile(tree[i])));
            input += code;
            try {
                tmp = evalInEnv(cemeEnv, code);
                if (typeof tmp !== 'undefined') {
                    output += tmp;
                }
            } catch (e) {
                //cemeEnv.ReportError('Compiler error \nCode:' + code + ' \nMessage:' + e.message);
                //console.log(code);
                //console.log(e.message);
                throw e;
            }
        }
        return output;
    }

    var codeblock  = function (code, output) {
        var result = '';
        result += '<h3> Compiled: </h2><pre><code> \n';
        result += escapeHtml(code);
        result +='</code></pre><h3> Evaluated: </h2>';
        result += output;
        return result;
    }

    var compile = function (tree) {
        var i;
        if (isSymbol(tree)) {
            return new Box(unsymbol(escapeSymbol(tree)), '');
        } else if (cemeEnv.IsAtom(tree)) {
            // constant literal
            return new Box(tree, '');
        }

        if (isSymbol(tree[0])) {
            var x = unsymbol(escapeSymbol(tree[0]));

            if (x === 'define') {
                if (cemeEnv.IsAtom(tree[1])) { // single variable
                    cemeEnv[unsymbol(tree[1])] = "";
                    return wrapdefines(_global(tree[1], tree[2]));
                } else {
                    cemeEnv[unsymbol(tree[1][0])] = "";
                    return wrapdefines(_globalfunction (tree[1][0],
                                tree[1].slice(1,tree[1].length),
                                compile(tree[2])));
                }
            } else if (x === 'import') {
                var filename = removeOneQuote(tree[1]);
                importFile('/code/' + filename);
                return new Box('""', '');
            } else if (x === 'let') {
                return _let(tree);
            } else if (x === 'list') {
                return _array(tree.slice(1, tree.length));
            } else if (x === 'function') {
                return _lambda (tree[1].slice(1,tree[1].length),
                        compile(tree[2]));
            } else if (x === 'if') {
                for (i = 1; i < tree.length; i++) {
                    tree[i] = compile(tree[i]);
                }
                return _if(unique(), tree);
            } else {
                // function call
                var curry = false;
                var called = tree.slice(1, tree.length);
                var params = [];
                var curryname = compile(tree[0]).value;
                for (i = 0; i < called.length; i++) {
                    called[i] = compile(called[i]);
                    if (isCurryDot(called[i])) {
                        curry = true;
                        var temp = new Symbol(unique());
                        params.push(temp);
                        called[i] = compile(temp);
                    }
                }

                if (curry) {
                    // curried call
                    var fname = unique();
                    var body = _call(curryname, called);
                    var currybody = _function (fname, params, body).value;
                    return new Box(fname, _expression(currybody));
                }

                if (x === 'apply') {
                    called[0] = new Box('null', '');
                    return _call(unsymbol(tree[1]) + '.apply', called);
                }
                if (x in infixOps) {
                    // binary operator
                    return _infix(infixOps[x], unsymbol(called[0]), unsymbol(called[1]));
                } else {
                    return _call(x, called);
                }
            }
        }
    }

    var parser  = function (tokens) {
        if (tokens.length === 0) 
            throw Error('no tokens found');
        var tree = [];
        var level = 0;
        while (tokens.length > 0) {
            if (tokens[1] === '(') {
                tree.push(makeList(tokens));
            } else {
                var token = tokens.shift();
                tree.push(token);
            }
            tokens.shift();
        }
        tree = tree[0];
        tree.shift();
        return tree; // remove dummy token
    }

    var makeList  = function (tokens) {
        var list = [];
        list.push(tokens.shift());
        tokens.shift();// Get rid of (
        while(tokens[0] !== ')') {
            if (tokens[1] === '(') {
                list.push(makeList(tokens));
            } else {
                list.push(tokens.shift());
            }
        }
        tokens.shift();
        return list;
    }

    var lexer  = function (input) {
        var i;
        var tokens = [];
        var indentStack = [];
        var indentLevel = 1;

        var regs = regexes();
        var length = input.length;
        while (length > 0) {
            for (i in regs) {
                var res = input.match(regs[i]);

                if (res !== null) {
                    res = res[0];
                    if (i === 'INDSPACE') {
                        var spaces = res.length;
                        if (spaces > indentLevel) {
                            indentStack.push(spaces - indentLevel);
                            indentLevel = spaces;
                            tokens.push('(');
                        }
                        if (spaces < indentLevel) {
                            while (indentLevel > spaces) {
                                indentLevel = indentLevel - indentStack.pop();
                                tokens.push(')');
                            }
                        }
                    } else if (i !== 'SPACE' && i !== 'COMMENT') {
                        if (i === 'NUMBER') {
                            tokens.push(parseFloat(res));
                        } else if (res === 'true') {
                            tokens.push(true);
                        } else if (res === 'else') {
                            tokens.push(true);
                        } else if (res === 'false') {
                            tokens.push(false);
                        } else if (res === 'empty-list') {
                            tokens.push('[]');
                        } else if (i === 'SYMBOL') {
                            var symbol = new Symbol(res);
                            tokens.push(symbol);
                        } else if (i === 'STRING') {
                            tokens.push(res);
                        } else if (i === 'LONGSTRING') {
                            var temp = res;
                            temp = toStringLiteral(removeOneQuote(removeOneQuote(temp)));
                            tokens.push(temp);
                        } else {
                            tokens.push(res);
                        }
                    }
                    input = input.substr(res.length);
                    break;
                }
            }

            // check whether stuck in infinite loop
            if (input.length === length) {
                throw SyntaxError('Check your quotes. Lexer stuck in infinite loop.');
            } else {
                length = input.length;
            }
        }
        // add dedents at the end
        //TODO: Remove duplication
        spaces = 1;
        while (indentLevel > spaces) {
            indentLevel = indentLevel - indentStack.pop();
            tokens.push(')');
        }

        return tokens;
    }

    var reShortString  = function () {
        var doubleQuoted = /^"(\\["'\\\/bfnrt]|[^\\"\n\r])*"/;
        var singleQuoted = /^'(\\["'\\\/bfnrt]|[^\\'\n\r])*'/;
        var result = new RegExp(singleQuoted.source +
                '|' + doubleQuoted.source);
        return result;
    }

    var regexes  = function () {
        var regs = {
            'COMMENT': /^[\r\n]* *#[^\r\n]*/,
            'NUMBER': /^-?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][+-]?[0-9]*)?/,
            'SYMBOL': /^[^ '"\r\n#:()]+/,
            'INDSPACE': /^(\r\n|\n|\r) */,
            'SPACE': /(^ +)|(^\r\n+)|(^\n+)|(^\r+)/,
            'INDENT': /^\(/,
            'DEDENT': /^\)/,
            'LONGSTRING': /^"""[^"""]*"""|^'''[^''']*'''/,
            'STRING': reShortString()
        };
        return regs;
    }

    /*********************************************************************************************/
    /* Grammar                                                                               */
    /*********************************************************************************************/

    var Box = function (value, hoist) {
        this.value = value;
        this.hoist = hoist;
    }

    var _unbox = function (box) {
        return box.hoist + box.value;
    }

    var isCurryDot = function (a) {
        return a instanceof Box && a.value === '.';
    }

    var indent = '    '

        // Hoisted

        var infixOps = {
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '%': '%',
            '>=': '>=',
            '<=': '<=',
            '>': '>',
            '<': '<',
            'equal?': '===',
            '!==': '!==',
            'or': '||',
            'and': '&&'
        };

    var _infix = function (name, a, b) {
        var result = '';
        result +='( '
                + a.value
                + ' '
                + name
                + ' '
                + b.value
                + ' )';
        return new Box(result, a.hoist + b.hoist);
    }

    var wrapdefines  = function (body) {
        var result = '';
        result += '(function () {\n';
            result += _indent(body.hoist + body.value + '\nreturn;');
            result += '\n})()';
        return new Box(result, '');
    }

    var _globalfunction  = function (name, params, body) {
        var result = '';
        result += unsymbol(name);
        result += ' = ';
        result += _lambda(params, body).value;
        return new Box(result, '');
    }

    var _function  = function (name, params, body) {
        var result = '';
        result += 'function ';
        result += name;
        result += _functionBody(params, body).value;
        return new Box(result, '');
    }

    var _lambda  = function (params, body) {
        var result = '';
        result += 'function ';
        result += _functionBody(params, body).value;
        return new Box(result, '');
    }

    var _functionBody  = function (params, body) {
        var result = '';
        result += ' \(';
        result += _parameters(params);
        result += '\) \{\n';
        result += _indent(body.hoist);
        result += _return(body.value);
        result += ';\n';
        result += '\}';
        return new Box(result, '');
    }

    var _cemeVar  = function (a) {
        if (a in cemeEnv) {
            var result = '';
            result += "cemeEnv['";
            result += a;
            result += "']";
            return result;
        } else {
            return a;
        }
    }

    var _global  = function (name, value) {
        var result = '';
        var val = compile(value);
        result += unsymbol(name);
        result += " = ";
        result += val.value;
        result += ';';
        return new Box(result, val.hoist);
    }

    var _local  = function (name, value) {
        var result = '';
        var val = compile(value);
        result += "var ";
        result += name;
        result += " = ";
        result += val.value;
        return new Box(result, val.hoist);
    }

    var _let  = function (tree) {
        var value = '';
        var hoist = '';
        var i;

        var nooflets = tree.length;
        for (i = 1; i < nooflets - 1; i = i + 2) {
            var result = _local(unsymbol(tree[i]), tree[i+1]);
            hoist += result.hoist;
            hoist += _expression(result.value);
        }
        var last = compile(tree[nooflets - 1]);
        hoist += last.hoist;
        return new Box(last.value , hoist);
    }

    var _if  = function (name, tree) {
        var result = '';
        var hoist = '';
        var i;
        result += _var(name);
        result += 'if ';
        result += '\( ';
        result += tree[1].value;
        hoist += tree[1].hoist;
        result += ' \) ';
        result += _block(_indent(_statement(tree[2].hoist + _assign(name, tree[2].value))));
        for (i = 3; i < tree.length; i=i+2) {
            result += ' else if ';
            result += '\( ';
            result += tree[i].value;
            hoist += tree[i].hoist;
            result += ' \) ';
            result += _block(_indent(_statement(tree[i+1].hoist + _assign(name, tree[i+1].value))));
        }
        result += '\n';
        var box = new Box(name, hoist + result);
        return box;
    }

    var _call  = function (name, args) {
        var i;
        var hoisted = '';
        for (i = 0; i < args.length; i++) {
            hoisted += args[i].hoist;
        }
        return new Box(name + ' \(' + _args(args) +'\)', hoisted);
    }

    var _array  = function (values) {
        var i;
        for (i = 0; i < values.length; i++) {
            values[i] = compile(values[i]);
        }
        var result = '';
        var hoist = ''
            result += '[';
        result += values[0].value;
        hoist += values[0].hoist;
        for (i = 1; i < values.length; i++) {
            result += ', ' + values[i].value;
            hoist += values[i].hoist;
        }
        result += ']';
        return new Box( result, hoist);
    }

    // Non hoisted

    var _parameters  = function (params) {
        var i;
        var result = ' ';
        result += escapeSymbol(params[0]).name;
        for (i = 1; i < params.length; i++) {
            result += ', ' + escapeSymbol(params[i]).name;
        }
        result += ' ';
        return result;
    }

    // 'param0, param1, param2'
    var _args  = function (params) {
        var i;
        var result = ' ';
        var hoisted = '';
        result += params[0].value;
        for (i = 1; i < params.length; i++) {
            result += ', ' + params[i].value;
            hoisted += params[i].value;
        }
        result += ' ';
        return result;
    }

    // 'return a'
    var _return  = function (a) {
        return 'return ' + a;
    }

    // 'some code;'
    var _statement  = function (a) {
        return a + ';';
    }

    // 'some code;
    // '
    var _expression  = function (a) {
        return _statement(a) + '\n';
    }

    // '{
    //  some code
    //  }'
    var _block  = function (a) {
        return '{\n' + a + '\n}';
    }

    // 'var name'
    var _var  = function (name) {
        return _expression('var ' + name);
    }

    // 'name = a'
    var _assign  = function (name, a) {
        return name + ' = ' + a;
    }

    var _indent  = function (block) {
        var result = block.replace(/\n/g, '\n' + indent);
        return indent + result;
    }

    var runUrl = function (sURL) {
        var text = fetchFile(sURL);
        var result = compiler(text);
        return result;
    }

    var compiler = function (text) {
        var tokens = lexer(text);
        tokens.unshift('(');
        tokens.unshift('main'); //dummy token
        tokens.push(')');
        var tree = parser(tokens);
        var result = compileAll(tree);

        return result;
    }

    var importFile = function (file) {
        var text = fetchFile(file);
        compiler(text);
    }

    /*********************************************************************************************/
    /* Helper
    /*********************************************************************************************/

    var Symbol = function (name) {
        this.name = name;
    }

    var isSymbol = function (a) {
        if (typeof a === 'undefined')
            return false;
        return a instanceof Symbol;
    }

    Symbol.prototype.toString = function symbolToString() {
        return '[Symbol: ' + this.name + ']';
    }

    var updateVariable  = function (name, value) {
        cemeEnv[name] = value;
    }

    // Generate a unique variable name on each call
    // prefixed with ceme
    var unique = (function () {
        var temp = 0;
        return function () {
            temp++;
            return 'ceme' + temp;
        }
    }());

    var toStringLiteral  = function (str) {
        // TODO not just line break
        // do everything
        str = str.replace(/\n/g, '\\n');
        return str;
    }

    var removeQuotes = function (text) {
        if (text[0] === '"' || text[0] === "'") {
            return text.slice(3, text.length - 3);
        }
        return text;
    }

    var removeOneQuote  = function (text) {
        if (text[0] === '"' || text[0] === "'") {
            return text.slice(1, text.length - 1);
        }
        return text;
    }

    var escapeSymbol = function (a) {
        if (a.name in cemeEnv) {
            return a;
        } else {
            var result = a.name;
            result = result.replace(/_/g, '__');
            result = result.replace(/-/g, '_d');
            result = result.replace(/\?/g, '_q');
            return new Symbol(result);
        }
    }

    var unsymbol = function (a) {
        if (a.name in cemeEnv) {
            return "cemeEnv['" + a.name + "']";
        } else if (a.name in infixOps) {
            return a.name;
        } else {
            return a.name;
        }
    }

    var escapeHtml = function (unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        'importFile': importFile,
        'updateVariable' : updateVariable,
        'main': runUrl,
        'lexer': lexer,
        'Symbol': Symbol,
        'isSymbol': isSymbol,
        'compile': compiler,
        'cemestart' : runUrl
    };
}();

(function(exports) {

    exports.importFile = ceme.importFile;
    exports.updateVariable = ceme.updateVariable;
    exports.cemestart = ceme.cemestart;
    exports.lexer = ceme.lexer;
    exports.Symbol = ceme.Symbol;
    exports.isSymbol = ceme.isSymbol;
    exports.compile = ceme.compile;
    exports.cemeEnv = cemeEnv;

})(typeof exports === 'undefined'? {} : exports);
