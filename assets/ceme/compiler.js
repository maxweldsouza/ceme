var cemeCompiler,
    ceme;

(function () {
    "use strict";
    var indent = '    ',
        macroTable = {},
        isArray,
        compile,
        unique;

    // cemeCompiler is an object that has functions
    // to compile and run ceme code
    cemeCompiler = (function () {
        var infixOps;

        function SyntaxError(message) {
            this.message = message;
        }

        function success(message) {
            $('#alert').hide().html(ceme.Alert(message, 'success')).fadeIn(200);
        }

        function warning(message) {
            $('#alert').hide().html(ceme.Alert(message, 'warning')).fadeIn(200);
        }

        function error(msg, lineno) {
            var message = msg;
            if (lineno !== undefined) {
                message += ' at line ' + lineno;
            }
            if (ceme.Alert) {
                $('#alert').hide().html(ceme.Alert(message, 'danger')).fadeIn(200);
            }
        }

        /* Helper */

        function CemeSymbol(name, lineno) {
            this.name = name;
            this.lineno = lineno;
        }

        function isSymbol(a) {
            if (a === undefined) {
                return false;
            }
            return a instanceof CemeSymbol;
        }

        CemeSymbol.prototype.toString = function symbolToString() {
            return '[Symbol: ' + this.name + ']';
        };

        // Generate a unique variable name on each call
        // prefixed with _ceme
        unique = (function () {
            var temp = 0;
            return function () {
                temp += 1;
                return '_ceme' + temp;
            };
        }());

        function toStringLiteral(str) {
            str = str.replace(/\n/g, '\\n');
            return str;
        }

        function removeOneQuote(text) {
            if (text[0] === '"' || text[0] === "'") {
                return text.slice(1, text.length - 1);
            }
            return text;
        }

        function escapeSymbol(a) {
            if (ceme.hasOwnProperty(a.name)) {
                return a;
            }
            var result = a.name;
            result = result.replace(/_/g, '__');
            result = result.replace(/-/g, '_d');
            result = result.replace(/\?/g, '_q');
            return new CemeSymbol(result, 0);
        }

        infixOps = {
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

        function unsymbol(a) {
            if (ceme.hasOwnProperty(a.name)) {
                if (/^[a-zA-Z0-9]+$/.test(a.name)) {
                    return "ceme." + a.name;
                }
                return "ceme['" + a.name + "']";
            }
            if (infixOps.hasOwnProperty(a.name)) {
                return a.name;
            }
            return a.name;
        }

        /* Grammar */

        // Box is a container of code
        // value holds the code itself and
        // hoist contains code that needs to
        // run before it
        // eg. value: x = square(x);
        //     hoist: var x;
        function Box(value, hoist) {
            this.value = value;
            this.hoist = hoist;
        }

        function _unbox(box) {
            return box.hoist + box.value;
        }

        function isCurryDot(a) {
            return a instanceof Box && a.value === '.';
        }

        // 'return a'
        function _return(a) {
            return 'return ' + a;
        }

        // 'some code;'
        function _statement(a) {
            return a + ';';
        }

        // 'some code;
        // '
        function _expression(a) {
            return _statement(a) + '\n';
        }

        // '{
        //  some code
        //  }'
        function _block(a) {
            return '{\n' + a + '\n}';
        }

        // 'var name'
        function _var(name) {
            return _expression('var ' + name);
        }

        // 'name = a'
        function _assign(name, a) {
            return name + ' = ' + a;
        }

        function _indent(block) {
            var result = block.replace(/\n/g, '\n' + indent);
            return indent + result;
        }

        // Non hoisted

        function _parameters(params) {
            var temp = [],
                i;
            if (!params) {
                return '';
            }
            for (i = 0; i < params.length; i += 1) {
                temp.push(escapeSymbol(params[i]).name);
            }
            return ' ' + temp.join(', ') + ' ';
            /*
            if (temp[0] === '*args') {
            }
            */
        }

        // 'param0, param1, param2'
        function _args(params) {
            var vals = [],
                i;
            for (i = 0; i < params.length; i += 1) {
                vals.push(params[i].value);
            }
            return vals.join(', ');
        }

        // Hoisted

        function _infix(name, a, b) {
            var result = '( ' + a.value + ' ' + name + ' ' + b.value + ' )';
            return new Box(result, a.hoist + b.hoist);
        }

        function wrapdefines(body) {
            var result = '';
            result += '(function () ';
            result += _block(_indent(body.hoist + body.value));
            result += '())';
            return new Box(result, '');
        }

        function _functionBody(params, body) {
            var result = ' (',
                fbody;
            result += _parameters(params);
            result += ') ';
            fbody = _indent(body.hoist);
            fbody += _return(_indent(body.value).trim()) + ';';
            result += _block(fbody);
            return new Box(result, '');
        }

        function _lambda(params, body) {
            var result = '';
            result += 'function';
            result += _functionBody(params, body).value;
            return new Box(result, '');
        }

        function _functionDefinition(tree) {
            var pms,
                bdy;
            if (!isSymbol(tree[1][0])) {
                throw new SyntaxError('Syntax error in function definition');
            }
            if (tree[1][0].name === 'unnamed') {
                if (tree[1].length > 1) {
                    pms = tree[1].slice(1, tree[1].length);
                } else {
                    pms = false;
                }
                bdy = compile(tree[2]);
                return _lambda(pms, bdy);
            }
            ceme[unsymbol(tree[1][0])] = "";
            return wrapdefines(_functionExpression(tree[1][0],
                tree[1].slice(1, tree[1].length),
                compile(tree[2])));
        }

        function _functionExpression(name, params, body) {
            var result = unsymbol(name) + ' = ';
            result += _lambda(params, body).value + ';';
            return new Box(result, '');
        }

        function _function(name, params, body) {
            var result = 'function ' + name;
            result += _functionBody(params, body).value;
            return new Box(result, '');
        }

        function _global(name, value) {
            var val = compile(value),
                result = unsymbol(name) + " = " + val.value + ';';
            return new Box(result, val.hoist);
        }

        function _local(name, value) {
            var val = compile(value),
                result = "var " + name + " = " + val.value;
            return new Box(result, val.hoist);
        }

        function _set(name, value) {
            var val = compile(value),
                result = unsymbol(name) + " = " + val.value;
            return new Box(result, val.hoist);
        }

        function _let(tree) {
            var hoist = '',
                i,
                nooflets = tree.length,
                last,
                result;

            for (i = 1; i < nooflets - 1; i = i + 2) {
                result = _local(unsymbol(tree[i]), tree[i + 1]);
                hoist += result.hoist;
                hoist += _expression(result.value);
            }
            last = compile(tree[nooflets - 1]);
            hoist += last.hoist;
            return new Box(last.value, hoist);
        }

        function _while(tree) {
            var i,
                value = '',
                hoist = '',
                result;
            result = 'while (' + compile(tree[0]).value + ') \n';
            for (i = 1; i < tree.length; i += 1) {
                tree[i] = compile(tree[i]);
                value += _statement(tree[i].value);
                value += '\n';
                hoist += tree[i].hoist;
            }
            result = result + _block(value);
            return new Box(result, hoist);
        }

        function _group(tree) {
            var i,
                value = '',
                hoist = '';
            for (i = 0; i < tree.length; i += 1) {
                tree[i] = compile(tree[i]);
                if (i === tree.length - 1) {
                    value += tree[i].value;
                } else {
                    hoist += _statement(tree[i].value);
                    hoist += '\n';
                }
                hoist += tree[i].hoist;
            }
            return new Box(value, hoist);
        }

        function _if(name, tree) {
            var result = '',
                hoist = '',
                box,
                i;
            for (i = 1; i < tree.length; i += 1) {
                tree[i] = compile(tree[i]);
            }
            result += _var(name);
            result += 'if ';
            result += '( ';
            result += tree[1].value;
            hoist += tree[1].hoist;
            result += ' ) ';
            result += _block(_indent(_statement(tree[2].hoist + _assign(name, tree[2].value))));
            for (i = 3; i < tree.length; i = i + 2) {
                // Comparison with true is intentional
                // This generates an else
                // instead of an else if (true)
                if (tree[i].value === true) {
                    result += ' else ';
                } else {
                    result += ' else if ';
                    result += '( ';
                    result += tree[i].value;
                    result += ' ) ';
                }

                hoist += tree[i].hoist;
                result += _block(_indent(_statement(tree[i + 1].hoist + _assign(name, tree[i + 1].value))));
            }
            result += '\n';
            box = new Box(name, hoist + result);
            return box;
        }

        function _call(name, args) {
            var i,
                hoisted = '';
            for (i = 0; i < args.length; i += 1) {
                hoisted += args[i].hoist;
            }
            return new Box(name + ' (' + _args(args) + ')', hoisted);
        }

        function _array(values) {
            var i,
                vals = [],
                hoists = [];
            for (i = 0; i < values.length; i += 1) {
                vals.push(compile(values[i]));
                vals[i] = (vals[i].value);
                hoists.push(values[i].hoist);
            }
            return new Box('[' + vals.join(', ') + ']',
                hoists.join(''));
        }

        if (isArray === undefined) {
            isArray = function (a) {
                return Object.prototype.toString.call(a) === '[object Array]';
            };
        }

        function nestedArrayToString(a) {
            var i,
                result = '';
            if (isArray(a[0])) {
                result += nestedArrayToString(a[0]);
            } else {
                result += a[0];
            }
            for (i = 1; i < a.length; i += 1) {
                if (isArray(a[i])) {
                    result += ', ' + nestedArrayToString(a[i]);
                } else {
                    result += ', ' + a[i];
                }
            }
            return '[' + result + ']';
        }

        function replace(tree, old, nu) {
            var i;
            for (i = 0; i < tree.length; i += 1) {
                if (ceme.IsAtom(tree[i])) {
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

        function addMacro(name, params, body) {
            var obj = {};
            obj.params = params;
            obj.body = body;
            macroTable[name] = obj;
        }

        function processMacros(tree) {
            var params,
                name,
                body,
                called,
                i,
                x;
            if (isSymbol(tree[0])) {
                x = unsymbol(escapeSymbol(tree[0]));
            }
            if (x === 'macro') {
                name = unsymbol(tree[1][0]);
                params = tree[1].slice(1);
                body = tree[2];
                addMacro(name, params, body);
            } else if (macroTable.hasOwnProperty(x)) {
                params = macroTable[x].params;
                body = macroTable[x].body;
                called = tree.slice(1);
                for (i = 0; i < called.length; i += 1) {
                    body = replace(body, params[i], called[i]);
                }
                tree = body;
            }
            return tree;
        }

        function compileTree(tree) {
            var output = '',
                tmp,
                i,
                code;
            for (i = 0; i < tree.length; i += 1) {
                tree[i] = processMacros(tree[i]);
            }
            for (i = 0; i < tree.length; i += 1) {
                try {
                    code = _expression(_unbox(compile(tree[i])));
                    tmp = eval(code);
                    if (isArray(tmp)) {
                        output += nestedArrayToString(tmp);
                    } else if (tmp !== undefined) {
                        output += tmp;
                    }
                } catch (err) {
                    error(err.message);
                    throw err;
                }
            }
            return output;
        }

        function getImports(tree) {
            var i,
                x,
                filename,
                imports = [];
            for (i = 0; i < tree.length; i += 1) {
                if (isSymbol(tree[i][0])) {
                    x = unsymbol(escapeSymbol(tree[i][0]));
                    if (x === 'import') {
                        filename = removeOneQuote(tree[i][1]);
                        // If the url begins with http
                        // or // consider it to be external
                        if (/^(http|\/\/)/.test(filename)) {
                            imports.push(filename);
                        } else {
                            imports.push('/code/' + filename);
                        }
                    }
                }
            }
            return imports;
        }

        var compile = function (tree) {
            var i,
                x,
                lineno,
                curry,
                called,
                params,
                curryname,
                fname,
                body,
                currybody,
                temp;
            if (isSymbol(tree)) {
                return new Box(unsymbol(escapeSymbol(tree)), '');
            }
            if (ceme.IsAtom(tree)) {
                // constant literal
                return new Box(tree, '');
            }

            if (isSymbol(tree[0])) {
                x = unsymbol(escapeSymbol(tree[0]));
                lineno = tree[0].lineno;

                switch (x) {
                case 'define':
                    if (ceme.IsAtom(tree[1])) { // single variable
                        ceme[unsymbol(tree[1])] = "";
                        return wrapdefines(_global(tree[1], tree[2]));
                    }
                    throw new SyntaxError('Syntax error in define at line ' + lineno);
                case 'group':
                    return _group(tree.slice(1, tree.length));
                case '=':
                    return _set(tree[1], tree[2]);
                case 'while':
                    return _while(tree.slice(1, tree.length));
                case 'import':
                    return new Box('""', '');
                case 'macro':
                    return new Box('""', '');
                case 'let':
                    return _let(tree);
                case 'list':
                    return _array(tree.slice(1, tree.length));
                case 'function':
                    return _functionDefinition(tree);
                case 'if':
                    return _if(unique(), tree);
                default:
                    // function call
                    curry = false;
                    called = tree.slice(1, tree.length);
                    params = [];
                    curryname = compile(tree[0]).value;
                    for (i = 0; i < called.length; i += 1) {
                        called[i] = compile(called[i]);
                        if (isCurryDot(called[i])) {
                            curry = true;
                            temp = new CemeSymbol(unique(), 0);
                            params.push(temp);
                            called[i] = compile(temp);
                        }
                    }

                    if (curry) {
                        // curried call
                        fname = unique();
                        body = _call(curryname, called);
                        currybody = _function(fname, params, body).value;
                        return new Box(fname, _expression(currybody));
                    }

                    if (x === 'apply') {
                        called[0] = new Box('null', '');
                        return _call(unsymbol(tree[1]) + '.apply', called);
                    }
                    if (infixOps.hasOwnProperty(x)) {
                        // binary operator
                        return _infix(infixOps[x], unsymbol(called[0]), unsymbol(called[1]));
                    }

                    for (i = 0; i < called.length; i += 1) {
                        if (called[i] === undefined) {
                            throw new SyntaxError('Syntax error in function call at ' + lineno);
                        }
                    }
                    return _call(x, called);
                }
            }
        };

        function makeList(tokens) {
            var list = [];
            list.push(tokens.shift());
            tokens.shift(); // Get rid of (
            while (tokens[0] !== ')') {
                if (tokens[1] === '(') {
                    list.push(makeList(tokens));
                } else {
                    list.push(tokens.shift());
                }
            }
            tokens.shift();
            return list;
        }

        function parser(tokens) {
            var tree = [],
                token;

            while (tokens.length) {
                if (tokens[1] === '(') {
                    tree.push(makeList(tokens));
                } else {
                    token = tokens.shift();
                    tree.push(token);
                }
                tokens.shift();
            }
            tree = tree[0];
            tree.shift(); // remove dummy token
            return tree;
        }

        var reShortString = (function () {
            var doubleQuoted = /^"(\\["'\\\/bfnrt]|[^\\"\n\r])*"/,
                singleQuoted = /^'(\\["'\\\/bfnrt]|[^\\'\n\r])*'/,
                result = new RegExp(singleQuoted.source +
                    '|' + doubleQuoted.source);
            return result;
        }());

        var regs = {
            'COMMENT': /^[\r\n]* *#[^\r\n]*/,
            //'DANGEROUS': /[\u0000-\u0008\u000a-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,
            'NUMBER': /^\-?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][+\-]?[0-9]*)?/,
            'SYMBOL': /^[^_ '"\r\n#:()][^ '"\r\n#:()]*/,
            'INDSPACE': /^(\r\n|\n|\r) */,
            'SPACE': /(^ +)|(^\r\n+)|(^\n+)|(^\r+)/,
            'INDENT': /^\(/,
            'DEDENT': /^\)/,
            'LONGSTRING': /^"""([^"]|\\")*"""|^'''([^']|\\')*'''/,
            'STRING': reShortString
        };

        function lexer(input) {
            var lineno = 1,
                linenos = [],
                i,
                tokens = [],
                indentStack = [],
                indentLevel = 1,
                length = input.length,
                res,
                spaces,
                symbol,
                temp;

            function addLines(no) {
                lineno += no;
                linenos.push(lineno);
            }

            function countLines(str) {
                return str.split(/\r\n|\r|\n/).length - 1;
            }

            while (length > 0) {
                for (i in regs) {
                    res = input.match(regs[i]);

                    if (res !== null) {
                        res = res[0];
                        if (i === 'INDSPACE') {
                            spaces = res.length;
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
                        } else {
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
                                symbol = new CemeSymbol(res, lineno);
                                tokens.push(symbol);
                            } else if (i === 'STRING') {
                                tokens.push(res);
                            } else if (i === 'LONGSTRING') {
                                addLines(countLines(res));

                                temp = res;
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
                    throw new SyntaxError('Check your quotes. Lexer is stuck', lineno);
                } else {
                    length = input.length;
                }
            }
            // add dedents at the end
            spaces = 1;
            while (indentLevel > spaces) {
                indentLevel = indentLevel - indentStack.pop();
                tokens.push(')');
            }

            return tokens;
        }

        function textToParseTree(text) {
            try {
                var tokens = lexer(text),
                    tree;
                tokens.unshift('(');
                tokens.unshift('main'); //dummy token
                tokens.push(')');
                tree = parser(tokens);
            } catch (err) {
                error(err.message);
                throw err;
            }
            return tree;
        }

        function compileText(text) {
            var tree = textToParseTree(text),
                result = compileTree(tree);
            return result;
        }

        function FileImports(name, checkdone) {
            this.name = name;
            this.done = false;
            this.executed = false;
            this.children = [];
            this.checkdone = checkdone;
            if (this.name.endsWith('.js')) {
                this.type = 'js';
            } else if (this.name.endsWith('.css')) {
                this.type = 'css';
            } else {
                this.type = 'ceme';
            }
        }

        FileImports.prototype.toString = function () {
            return 'FileImport: ' + this.name;
        };

        FileImports.prototype.checkdone = function () {
            return this.done;
        };

        FileImports.prototype.addToList = function (child) {
            var childobj = new FileImports(child, this.checkdone);
            this.children.push(childobj);
        };

        FileImports.prototype.checkAllDone = function () {
            var i,
                child;
            if (!this.done) {
                return false;
            }
            for (i = 0; i < this.children.length; i += 1) {
                child = this.children[i];
                if (child.done === false) {
                    return false;
                }
                if (!child.checkAllDone()) {
                    return false;
                }
            }
            return true;
        };

        FileImports.prototype.request = function () {
            var fileobj = this,
                tree,
                imports,
                i;
            if (!fileobj.done) {
                $.ajax({
                    url: this.name,
                    type: 'GET',
                    success: function (data) {
                        tree = textToParseTree(data);
                        imports = getImports(tree);
                        fileobj.code = data;
                        fileobj.tree = tree;
                        fileobj.done = true;
                        for (i = 0; i < imports.length; i += 1) {
                            fileobj.addToList(imports[i]);
                        }
                        fileobj.requestAll();
                        fileobj.checkdone();
                    },
                    error: function (request) {
                        if (request.status === 0) {
                            ceme.error('No internet connection');
                        } else {
                            error(request.responseText);
                        }
                    }
                });
            }
        };

        function importStatic(filename, extension) {
            function escapeSelector(id) {
                var temp = id.replace(/(:|\.|\[|\]|,)/g, "\\$1");
                temp = temp.replace(new RegExp('/', 'g'), '\\/');
                return temp;
            }

            function addJsToDom(fileid, filename) {
                $('head').append('<script id="' + fileid + '" src="' + filename + '" type="text/javascript" />');
            }

            function addCssToDom(fileid, filename) {
                $('head').append('<link rel="stylesheet" id="' + fileid + '" href="' + filename + '" type="text/css" />');
            }

            var selector = '#ceme-import-' + escapeSelector(filename),
                fileid = 'ceme-import-' + filename;

            // Add the file to dom only if it isn't already
            // present
            if (!$(selector).length) {
                if (extension === 'css') {
                    addCssToDom(fileid, filename);
                } else if (extension === 'js') {
                    addJsToDom(fileid, filename);
                }
            }
        }

        FileImports.prototype.requestStatic = function () {
            var fileobj = this;
            if (!fileobj.done) {
                $.ajax({
                    url: this.name,
                    type: 'GET',
                    success: function (data) {
                        fileobj.code = data;
                        fileobj.done = true;
                        importStatic(fileobj.name, fileobj.type);
                        fileobj.checkdone();
                    },
                    error: function (request) {
                        if (request.status === 0) {
                            ceme.error('No internet connection');
                        } else {
                            error(request.responseText);
                        }
                    }
                });
            }
        };

        FileImports.prototype.requestAll = function () {
            var i,
                child;
            if (!this.code) {
                if (this.type === 'ceme') {
                    this.request();
                } else {
                    this.requestStatic();
                }
            }
            this.checkdone();
            for (i = 0; i < this.children.length; i += 1) {
                child = this.children[i];
                child.requestAll();
            }
        };

        FileImports.prototype.importChildren = function () {
            var i;
            if (this.type === 'ceme') {
                for (i = 0; i < this.children.length; i += 1) {
                    this.children[i].importAll();
                }
            }
        };

        FileImports.prototype.importAll = function () {
            this.importChildren();
            this.importSingle();
        };

        FileImports.prototype.importSingle = function () {
            if (this.type === 'ceme') {
                compileText(this.code);
            }
        };

        // The compiler compiles ceme code to javascript, it then
        // runs the javascript code with generates html
        // The generated html is passed as an argument to the
        // callback
        //
        // The asynchronous compiler takes an object with three
        // properties
        //     filepath: Path to the file to be compiled
        //          or
        //     code: Source code that needs to be compiled
        //     callback: optional callback
        //     The callback is a function of two arguments
        //         code: ceme source code
        //         output: generated html

        function asyncCompiler(params) {
            var tree,
                imports,
                i,
                mainFile;
            mainFile = new FileImports(params.filepath, function () {
                var output;
                if (mainFile.checkAllDone() && !mainFile.executed) {
                    if (mainFile.type === 'ceme') {
                        mainFile.importChildren();
                        output = compileTree(mainFile.tree);
                        params.callback(mainFile.code, output);
                        mainFile.executed = true;
                    } else {
                        mainFile.importSingle();
                    }
                }
            });
            if (mainFile.type === 'ceme') {
                if (params.code !== undefined) {
                    tree = textToParseTree(params.code);
                    imports = getImports(tree);
                    mainFile.code = params.code;
                    mainFile.done = true;
                    mainFile.tree = tree;
                    for (i = 0; i < imports.length; i += 1) {
                        mainFile.addToList(imports[i]);
                    }
                }
            }
            mainFile.requestAll();
        }

        return {
            'lexer': lexer,
            'CemeSymbol': CemeSymbol,
            'isSymbol': isSymbol,
            'compileText': compileText,
            'asyncCompiler': asyncCompiler,
            'success': success,
            'warning': warning,
            'error': error
        };
    }());

}());
