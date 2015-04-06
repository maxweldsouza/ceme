/** Copyright 2014, Maxwel D'souza

 The information contained herein is the intellectual
 property of Maxwel D'souza. It is NOT property of any
 partnerships and/or companies owned by the author.
 Reproduction in any form is strictly prohibited unless
 prior written permission is obtained from the author.  */

"use strict";

var cemeEnv = {};
var ceme = function () {

    var success = function (message) {
        $('#alert').hide().html(cemeEnv.Alert(message, 'success')).fadeIn(200);
    }
    var warning = function (message) {
        $('#alert').hide().html(cemeEnv.Alert(message, 'warning')).fadeIn(200);
    }
    var error = function (msg, lineno) {
        var message = msg;
        if (typeof lineno !== 'undefined') {
            message += ' at line ' + lineno;
        }
        if (cemeEnv.Alert) {
            $('#alert').hide().html(cemeEnv.Alert(message, 'danger')).fadeIn(200);
        } else {
            //console.log(message);
        }
        throw message;
    }

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
            src.replace('\r\n', '\n');
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

    var IsArray = Array.isArray || function (a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    var NestedArrayToString = function (a) {
        var i;
        var result = '';
        if (IsArray(a[0])) {
            result += NestedArrayToString(a[0]);
        } else {
            result += a[0];
        }
        for (i = 1; i < a.length; i++) {
            if (IsArray(a[i])) {
                result += ', ' + NestedArrayToString(a[i]);
            } else {
                result += ', ' + a[i];
            }
        }
        return '[' + result + ']';
    }

    /*********************************************************************************************/
    /* Compiler                                                                               */
    /*********************************************************************************************/

    var compileTree = function (tree) {
        var input = '';
        var output = '';
        var tmp;
        var i;
        for (i = 0; i < tree.length; i++) {
            tree[i] = processMacros(tree[i]);
        }
        for (i = 0; i < tree.length; i++) {
            var code = _expression(_unbox(compile(tree[i])));
            input += code;
            try {
                tmp = evalInEnv(cemeEnv, code);
                if (typeof tmp === 'undefined') {
                } else if (IsArray(tmp)) {
                    output += NestedArrayToString(tmp);
                } else {
                    output += tmp;
                }
            } catch (err) {
                error(err.message);
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

    var getImports = function (tree) {
        var i;
        var imports = [];
        for (i = 0; i < tree.length; i++) {
            if (isSymbol(tree[i][0])) {
                var x = unsymbol(escapeSymbol(tree[i][0]));
                if (x === 'import') {
                    var filename = removeOneQuote(tree[i][1]);
                    imports.push('/code/' + filename);
                }
            }
        }
        return imports;
    }

    var macroTable = {};

    var replace = function (tree, old, nu) {
        var i;
        for (i = 0; i < tree.length; i++) {
            if (cemeEnv.IsAtom(tree[i])) {
                if (isSymbol(tree[i])) {
                    if (tree[i].name === old.name) {
                        tree[i] = nu;
                    }
                }
            } else {
                tree[i] = replace(tree[i], old, nu);
            }
        }
        return tree;
    }

    var addMacro = function (name, params, body) {
        var obj = {};
        obj.params = params;
        obj.body = body;
        macroTable[name] = obj;
    }

    var processMacros = function (tree) {
        if (isSymbol(tree[0])) {
            var x = unsymbol(escapeSymbol(tree[0]));
        }
        if (x === 'macro') {
            var name = unsymbol(tree[1][0]);
            var params = tree[1].slice(1);
            var body = tree[2];
            addMacro(name, params, body);
        } else if (x in macroTable) {
            var params = macroTable[x].params;
            var body = macroTable[x].body;
            var called = tree.slice(1);
            var i;
            for (i = 0; i < called.length; i++) {
                body = replace(body, params[i], called[i]);
            }
            tree = body;
        }
        return tree;
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
                return new Box('""', '');
            } else if (x === 'macro') {
                return new Box('""', '');
            } else if (x === 'let') {
                return _let(tree);
            } else if (x === 'list') {
                return _array(tree.slice(1, tree.length));
            } else if (x === 'function') {
                var pms, bdy;
                if (tree[1].length > 1) {
                    pms = tree[1].slice(1,tree[1].length);
                } else {
                    pms = false;
                }
                bdy = compile(tree[2]);
                return _lambda (pms, bdy);
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

    var parser  = function (lexed) {
        var tokens = lexed.tokens;
        var linenos = lexed.linenos;
        if (tokens.length === 0) 
            error('No tokens found');

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
        tree.shift(); // remove dummy token
        return tree;
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
        var lineno = 1;
        var linenos = [];

        var addLines = function (no) {
            lineno += no;
            linenos.push(lineno);
        }
        var countLines = function (str) {
            return str.split(/\r\n|\r|\n/).length - 1;
        }

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
                        addLines(1);
                    } else  {
                        if (i === 'SPACE' || i === 'COMMENT') {
                            addLines(countLines(res));
                        } else if (i === 'NUMBER') {
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
                            addLines(countLines(res));

                            var temp = res;
                            temp = toStringLiteral(removeOneQuote(removeOneQuote(temp)));
                            tokens.push(temp);
                        //} else if (i === 'DANGEROUS') {
                        //    error('Dangerous character');
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
                error('Check your quotes. Lexer stuck in infinite loop', lineno);
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

        return { 'tokens': tokens, 'linenos': linenos };
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
            //'DANGEROUS': /[\u0000-\u0008\u000a-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,
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
        if (!params) {
            return '';
        }
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

    var compileFile = function (sURL) {
        var text = fetchFile(sURL);
        var result = compileText(text);
        return result;
    }

    var textToParseTree = function (text) {
        var lexed = lexer(text);
        lexed.tokens.unshift('(');
        lexed.tokens.unshift('main'); //dummy token
        lexed.tokens.push(')');
        var tree = parser(lexed);
        return tree;
    }

    var compileText = function (text) {
        var tree = textToParseTree(text);
        var result = compileTree(tree);
        return result;
    }

    var importFile = function (file) {
        var text = fetchFile(file);
        compileText(text);
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

    var FileImports = function (name, callback) {
        this.name = name;
        this.done = false;
        this.code = '';
        this.children = [];
        this.callback = callback;
    }

    FileImports.prototype.toString = function () {
        return 'FileImport: ' + this.name;
    }

    FileImports.prototype.checkdone = function () {
        return this.done;
    }

    FileImports.prototype.addToList = function (child) {
        var childobj = new FileImports(child, this.callback);
        this.children.push(childobj);
    }

    FileImports.prototype.checkAllDone = function () {
        var i;
        if (!this.done) {
            return false;
        }
        for (i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if (child.done === false) {
                return false;
            }
            if (!child.checkAllDone()) {
                return false;
            }
        }
        return true;
    }

    FileImports.prototype.request = function () {
        var fileobj = this;
        if (!fileobj.done) {
            $.ajax({
                    url : this.name,
                    type : 'GET',
                    success : function (data) {
                        var tree = textToParseTree(data);
                        var imports = getImports(tree);
                        var i;
                        fileobj.code = data;
                        fileobj.tree = tree;
                        fileobj.done = true;
                        for (i = 0; i < imports.length; i++) {
                            fileobj.addToList(imports[i]);
                        }
                        fileobj.requestAll();
                        fileobj.callback();
                    },
                    error : function (request, e) {
                        error(request.responseText);
                    }
            });
        }
        fileobj.callback();
    }

    FileImports.prototype.requestAll = function () {
        this.request();
        var i;
        for (i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.requestAll();
        }
    }

    FileImports.prototype.importAll = function () {
        var i;
        for (i = 0; i < this.children.length; i++) {
            this.children[i].importAll();
        }
        compileText(this.code);
    }

    var asyncCompiler = function (filename, callback, code) {
        var mainFile = new FileImports(filename, function () {
            if (mainFile.checkAllDone()) {
                mainFile.importAll();
                var output = compileTree(mainFile.tree);
                callback(mainFile.code, output);
            }
        });
        if (code) {
            var tree = textToParseTree(code);
            var imports = getImports(tree);
            var i;
            mainFile.code = code;
            mainFile.done = true;
            mainFile.tree = tree;
            for (i = 0; i < imports.length; i++) {
                mainFile.addToList(imports[i]);
            }
        }
        mainFile.requestAll();
    }

    return {
        'lexer': lexer,
        'Symbol': Symbol,
        'isSymbol': isSymbol,
        'importFile': importFile,
        'compileText': compileText,
        'compileFile' : compileFile,
        'asyncCompiler' : asyncCompiler,
        'success': success,
        'warning': warning,
        'error': error
    };
}();

(function(exports) {

    exports.lexer = ceme.lexer;
    exports.Symbol = ceme.Symbol;
    exports.isSymbol = ceme.isSymbol;
    exports.importFile = ceme.importFile;
    exports.compileFile = ceme.compileFile;
    exports.compileText = ceme.compileText;
    exports.cemeEnv = cemeEnv;

})(typeof exports === 'undefined'? {} : exports);
