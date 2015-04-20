"use strict";

// TODO dry
// TODO dont reveal info about server
var platform  = function () {
    if (typeof XMLHttpRequest !== 'undefined') {
        return 'browser';
    } else if (typeof exports !== 'undefined') {
        return 'nodejs';
    }
}

// Polyfills
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (position === undefined || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    };
}

var cemeEnv = function() {
    // Arrays
    var First = function (list) {
        if (IsEmptyArray(list)) {
            throw Error('Cant get first of empty array ' + list);
        } else if (cemeEnv.IsAtom(list)) {
            throw Error('Cant get first of atom ' + list);
        }
        return list[0];
    }

    // TODO rename
    var Rest = function (list) {
        if (IsEmptyArray(list)) {
            throw Error('Cant Rest an empty array: ' + list);
        } else if (cemeEnv.IsAtom(list)) {
            throw Error('Cant Rest an atom: ' + list);
        }
        return list.slice(1, list.length);
    }

    var IsArray = Array.isArray || function (a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    }

    var IsLat = function (a) {
        var i;
        if (!IsArray(a))
            return false;
        for (i = 0; i < a.length; i++) {
            if (IsArray(a[i])) {
                return false;
            }
        }
        return true;
    }

    var IsEmptyArray = function (tree) {
        return IsArray(tree) && tree.length === 0;
    }

    var IndexOf = function (x, lst) {
        var i;
        for (i = 0; i < lst.length; i++) {
            if (lst[i] === x) {
                return i;
            }
        }
        return -1;
    };

    var SplitIntoArraysOfSize = function (lst, no) {
        var result = [];
        var sublst = [];
        var i;
        for (i = 0; i < lst.length; i++) {
            sublst.push(lst[i]);
            if (sublst.length >= no) {
                result.push(sublst);
                sublst = [];
            }
        }
        if (sublst.length > 0) {
            result.push(sublst);
        }
        return result;
    }

    // Sort
    var RandomInt = function (l, u) {
        return Math.floor((Math.random() * u) + l);
    }

    var Formatter = function () {
        console.log('Dont use formatter, use format instead');
        var str = arguments[0];
        var i;
        for (i = 1; i < arguments.length; i++) {
            str = str.replace(/%s/, arguments[i].toString());
        }
        return str;
    }

    return {

            //////// Html

            'WindowTitle': function (a) {
                $('html > head > title').remove();
                var title = '<title>' + a + '</title>';
                $('html > head').append(title);
                return '';
            },
            'MetaDescription': function (a) {
                $('meta[name=description]').remove();
                var description = '<meta name="description" content="' + a + '">';
                $('head').append( description );
                return '';
            },

            //////// Math

            //// Logical

            'not': function (a) {
                return !a;
            },
            'and': function (a, b) {
                return a && b;
            },
            'or': function (a, b) {
                return a || b;
            },

            //// Comparison

            '==': function (a, b) {
                return (a === b);
            },
            '>': function (a, b) {
                return a > b;
            },
            '<': function (a, b) {
                return a < b;
            },
            '>=': function (a, b) {
                return a >= b;
            },
            '<=': function (a, b) {
                return a <= b;
            },

            //// Arithmetic

            '*' : function (a, b) {
                var i;
                var result = arguments[0];
                for (i = 1; i < arguments.length; i++) {
                    result *= arguments[i];
                }
                return result;
            },
            '/' : function (a, b) {
                var i;
                var result = arguments[0];
                for (i = 1; i < arguments.length; i++) {
                    result /= arguments[i];
                }
                return result;
            },
            '+' : function () {
                var i;
                var result = arguments[0];
                for (i = 1; i < arguments.length; i++) {
                    result += arguments[i];
                }
                return result;
            },
            '-' : function (a, b) {
                var i;
                var result = arguments[0];
                for (i = 1; i < arguments.length; i++) {
                    result -= arguments[i];
                }
                return result;
            },
            'Abs': Math.abs,
            'ArcCos': Math.acos,
            'ArcSin': Math.asin,
            'ArcTan': Math.atan,
            'Ceiling': Math.ceil,
            'Exp': Math.exp,
            'Floor': Math.floor,
            'Ln': Math.log,
            'Max': Math.max,
            'Min': Math.min,
            'Power': Math.pow,
            'Random': Math.random,
            'Round': Math.round,
            'Sqrt': Math.sqrt,
            'Tan': Math.tan,


            'Sin': function (x) {
                var x = x - Math.floor(x);
                if (x > 0.75) {
                    x -= 1;
                } else if (x > 0.5) {
                    x -= 0.5;
                    x *= -1;
                } else if (x > 0.25) {
                    x -= 0.5;
                }
                return Math.sin(2 * Math.PI * x);
            },
            'Cos': function (x) {
                return cemeEnv.Sine(x + 0.25);
            },

            //////// Arrays

            //// Predicates

            'IsArray': IsArray,

            //// Items

            'First': First,
            'Rest': Rest,
            'Second': function (a) {
                return a[1];
            },
            'Last': function (a) {
                return a[a.length - 1];
            },

            //// Create

            'Insert': function (lst, item) {
                lst.unshift(item);
                return lst;
            },
            'Append': function (lst, item) {
                lst.push(item);
                return lst;
            },

            //// Other

            'Length': function (a) {
                return a.length;
            },
            'Reverse': function (a) {
                return a.reverse();
            },
            'Nth': function (lst, n) {
                if (n >= lst.length || n < 0) {
                    return [];
                } else {
                    return lst[n];
                }
            },
            'IndexOf': IndexOf,

            //////// Functional

            'Map': function (f, lst) {
                var result = [];
                var i;
                for (i = 0; i < lst.length; i++) {
                    result.push(f(lst[i]));
                }
                return result;
            },

            'Reduce': function (f, lst) {
                if (lst.length === 0) {
                    return lst;
                }
                var result = lst[0];
                var i;
                for (i = 1; i < lst.length; i++) {
                    result = f(result, lst[i]);
                }
                return result;
            },
            'ReduceRight': function (f, lst) {
                return cemeEnv.Reduce(f, cemeEnv.Reverse(lst));
            },

            'Filter': function (f, arg) {
                return arg.filter(f);
            },
            //////// Iteration
            'Repeat': function (no, f) {
                var i;
                for (i = 0; i < no; i++) {
                    f();
                }
            },

            //////// Sets

            'MakeSet': function (x) {
                var result = [];
                var i;
                for (i = 0; i < x.length; i++) {
                    if (cemeEnv.IsMember(x[i], result)) {
                    } else {
                        result.push(x[i]);
                    }
                }
                return result;
            },
            'IntersectSets': function (x, y) {
                var i;
                var result = [];
                for (i = 0; i < x.length; i++ ) {
                    if (cemeEnv.IsMember(x[i], y)) {
                        result.push(x[i]);
                    }
                }
                return result;
            },

            //// Cutting

            'Slice': function (arr, start, finish) {
                return arr.slice(start, finish);
            },
            'Sublist': function (lst, start) {
                return lst.slice(start, lst.length);
            },
            //////// Numbers

            'Range': function (a, b) {
                var lst = [];
                var i;
                for (i = a; i <= b; i++) {
                    lst.push(i);
                }
                return lst;
            },
            'ParseInt': function (a) {
                return parseInt(a);
            },
            '%': function (a, b) {
                return a % b;
            },

            //////// Strings

            'StartsWith': function (str, searchString) {
                return str.startsWith(searchString);
            },
            'EndsWith': function (str, searchString) {
                return str.endsWith(searchString);
            },
            'FindString': function (x, y) {
                return x.indexOf(y);
            },
            'FindStringReverse': function (x, y) {
                return x.lastIndexOf(y);
            },
            'Split': function (str, chr) {
                return str.split(chr);
            },
            'LowerCase': function (str) {
                return str.toLowerCase();
            },
            'UpperCase': function (str) {
                return str.toUpperCase();
            },
            'Trim': function (str) {
                return str.trim();
            },
            'Join': function(lst, delim) {
                return lst.join(delim);
            },
            'Formatter': Formatter,
            'Format': function () {
                var args = arguments;
                var str = arguments[0];
                var i;
                str = str.replace(/\{\{|\}\}|\{(\d+)\}/g, function (x, i) {
                    if (x === '{{') {
                        return '{';
                    } else if (x === '}}') {
                        return '}'
                    } else {
                        i = parseInt(x[1]) + 1;
                        if (i >= args.length) {
                            throw new Error('Too few arguments for format string');
                        }
                        return args[i];
                    }
                });
                return str;
            },

            'MaxList': function (a) {
                var temp = cemeEnv['Reduce'](cemeEnv['Max'], a);
                return temp;
            },
            'MinList': function (a) {
                var temp = cemeEnv['Reduce'](cemeEnv['Min'], a);
                return temp;
            },
            'Print': function (a) {
                console.log(a);
                return '';
            },
            'EscapeHtml': function (unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            },

            /* MapCar takes a function and a list of lists
            and applies the function successively to the nth element
            of each of the lists and returns a list as a result */
            'MapCar': function(fn, lst) {
                var i, j;
                var result = [];
                var args;
                for (i = 0; i < lst[0].length; i++) {
                    args = [];
                    for (j = 0; j < lst.length; j++) {
                        args.push(lst[j][i]);
                    }
                    result.push(fn.apply(null, args));
                }
                return result;
            },
            ////// Language
            'CemeLanguage': {
                // Open close tags
                // Order of tags is important for syntax
                // highlighting to work properly
                // pre should come before p
                'HtmlTags': ('div,ol,ul,li,span,script,button,' +
                    'table,thead,tbody,h1,h2,h3,h4,h5,h6,' +
                    'tr,td,th,form,noscript,strong,em,' +
                    'blockquote,cite,pre,code,body,q,p,a').split(','),
                'Keywords': ('define,function,unnamed,while,' +
                    'import,let,list,function,if,apply').split(',')
            },

            'EvalString': function (str) {
                return ceme.compileText(str);
            },
            'UTCToLocalTime': function (utc) {
                var date = new Date(utc);
                return date.toLocaleString();
            },

            //////// Scantuary

            /* get the indices of the elements of the array which pass
            the given condition */
            'FilterIds': function (fn, lst) {
                var i;
                var result = [];
                for (i = 0; i < lst.length; i++) {
                    if (fn(lst[i])) {
                        result.push(i);
                    }
                }
                return result;
            },

            /* get the ids of the elements of the array which pass
            the given condition */
            'FilterKeys': function (fn, lst, keys) {
                var i;
                var result = [];
                for (i = 0; i < lst.length; i++) {
                    if (fn(lst[i])) {
                        result.push(keys[i]);
                    }
                }
                return result;
            },

            'IsAtom': function (a) {
                return !IsArray(a);
            },
            'IsNull': function (a) {
                return IsArray(a) && a.length === 0;
            },
            'IsMember': function (x, lst) {
                var i;
                for (i = 0; i < lst.length; i++) {
                    if (lst[i] === x) {
                        return true;
                    }
                }
                return false;
            },
            'IsNumber': function (a) {
                return typeof a === 'number';
            },
            'RandomInt': function (min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            'GetCookie': function(name) {
                var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
                return r ? r[1] : undefined;
            },
            'Getkey': function (item, key) {
                return item[key];
            },
            'AjaxGet': function (uri) {
                var temp;
                $.ajax({
                    url: uri,
                    async: false,
                    dataType: 'json',
                    success: function(data) {
                        temp = data;
                    }
                });
                return temp;
            },
            //////// Sorting

            'SortNumbers': function (a) {
                var result;
                result = a.sort(function (b, c) { return b - c; });
                return result;
            },
            'SortStrings': function (a) {
                return a.sort();
            },

            /***************************
             * Scantuary
             **************************/
            'ItemsAt': function (x, ids) {
                var i;
                var result = [];
                for (i = 0; i < ids.length; i++) {
                    result.push(x[ids[i]]);
                }
                return result;
            },
            'ItemWithIds': function (x, ids, target) {
                var i,j;
                var result = [];
                for (i = 0; i < target.length; i++) {
                    var ind = IndexOf(target[i], ids);
                    if (ind !== -1) {
                        result.push(x[ind]);
                    }
                }
                return result;
            },

            'SplitIntoArraysOfSize': SplitIntoArraysOfSize,
            'SplitInto': function(lst, no) {
                var elemsperlist = Math.ceil(lst.length / no);
                return SplitIntoArraysOfSize(lst, elemsperlist);
            }
    }
}();

(function () {
    /***********************************************************************************/
    /* Html
    /***********************************************************************************/

    var open = function (a, atr) { return '<' + a + atr + '>'; }
    var close = function (a) { return '</' + a + '>'; }
    var tag = function (a) {
        return function () {
            var i;
            var result = '';
            var atr = '';
            for (i = 0; i < arguments.length; i++) {
                if (arguments[i] instanceof Attrib) {
                    atr += arguments[i].value;
                } else {
                    result += arguments[i];
                }
            }
            return open(a, atr) + result + close (a);
        }
    }
    var sctag = function (a) {
        var atr = '';
        var tag = '';
        var i;
        for (i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Attrib) {
                atr += arguments[i].value;
            } else {
                tag += arguments[i];
            }
        }
        return '<' + a + atr + '/>';
    }
    var sctagWithAttrib = function (a) {
        return function () {
            var atr = '';
            var tag = '';
            var i;
            for (i = 0; i < arguments.length; i++) {
                if (arguments[i] instanceof Attrib) {
                    atr += arguments[i].value;
                } else {
                    tag += arguments[i];
                }
            }
            return '<' + a + atr + '/>';
        }
    }
    cemeEnv['attrib'] = function (a) {
        var i;
        var result = '';
        for (i = 0; i < arguments.length; i++) {
            result += arguments[i];
        }
        return new Attrib(result);
    }
    var Attrib = function (value) {
        this.value = value;
    }
    var attribute = function (a) {
        return function (b) {
            return ' ' + a + '="' + b + '" ';
        }
    }

    // Attributes
    cemeEnv['type'] = attribute('type');

    var attributes = ('src,class,value,id,style,' +
            'href,title,target').split(',');

    var i;
    for (i = 0; i < attributes.length; i++) {
        cemeEnv[attributes[i]] = attribute(attributes[i]);
    }

    // Self closing tags
    cemeEnv['hr'] = sctag('hr');
    cemeEnv['br'] = sctag('br');
    cemeEnv['img'] = sctagWithAttrib('img');

    var tags = cemeEnv.CemeLanguage.HtmlTags;
    for (i = 0; i < tags.length; i++) {
        cemeEnv[tags[i]] = tag(tags[i]);
    }
})();

(function(exports) {

    exports.cemeEnv = cemeEnv;

})(typeof exports === 'undefined'? this['lib']={}: exports);

