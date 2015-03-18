/** Copyright 2014, Maxwel D'souza

  The information contained herein is the intellectual
  property of Maxwel D'souza. It is NOT property of any
  partnerships and/or companies owned by the author.
  Reproduction in any form is strictly prohibited unless
  prior written permission is obtained from the author.  */

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

    var MaxwelSortIds = function (lst, ids, gt) {
        var lt = function (a, b) {
            return !gt(a,b);
        }

        var merge = function (al, au, bu) {
            var i;
            var j;
            var k;
            var result, resultids;
            var bl = au + 1;

            if (al > au) {
                return;
            } else if (bl > bu) {
                return;
            } else if (gt(lst[bl],lst[au])) {
                return;
            } else if (gt(lst[al], lst[bu])) {
                result = [];
                resultids = [];
                for (i = bl; i <= bu; i++) {
                    result.push(lst[i]);
                    resultids.push(ids[i]);
                }
                for (i = al; i <= au; i++) {
                    result.push(lst[i]);
                    resultids.push(ids[i]);
                }
                i = 0;
                for (k = al; k <= bu; k++) {
                    lst[k] = result[i];
                    ids[k] = resultids[i];
                    i++;
                }
                return;
            }

            result = [];
            resultids = [];
            i = al;
            j = bl;
            while (true) {
                if (i > au) {
                    for (;j <= bu; j++) {
                        result.push(lst[j]);
                        resultids.push(ids[j]);
                    }
                    break;
                } else if (j > bu) {
                    for (;i <= au; i++) {
                        result.push(lst[i]);
                        resultids.push(ids[i]);
                    }
                    break;
                } else if (lt(lst[i], lst[j])) {
                    result.push( lst[i] );
                    resultids.push(ids[i]);
                    i++;
                } else {
                    result.push( lst[j] );
                    resultids.push(ids[j]);
                    j++;
                }
            }
            i = 0;
            for (k = al; k <= bu; k++) {
                lst[k] = result[i];
                ids[k] = resultids[i];
                i++;
            }
        }

        var msort = function (l, u) {
            if (l >= u) {
                return;
            }
            var p = Math.floor((u + l) / 2);
            msort(l, p);
            msort(p+1, u);
            merge(l, p, u);
            return;
        }

        msort( 0, lst.length - 1 );
        return ids;
    }

    // TODO Rename
    var MaxwelSort = function (lst, ids) {
        var gt = function (a, b) {
            if (typeof a !== typeof b) {
                return typeof a > typeof b;
            }
            if (a === '-') {
                return true;
            }
            if (b === '-') {
                return false;
            }
            return a > b;
        }
        return MaxwelSortIds(lst, ids, gt);
    }
    var MaxwelSortReverse = function (lst, ids) {
        var gt = function (a, b) {
            if (typeof a !== typeof b) {
                return typeof a < typeof b;
            }
            if (a === '-') {
                return false;
            }
            if (b === '-') {
                return true;
            }
            return a > b;
        }
        return MaxwelSortIds(lst, ids, gt);
    }

    var sum = function () {
        var i;
        var result = arguments[0];
        for (i = 1; i < arguments.length; i++) {
            result += arguments[i];
        }
        return result;
    }

    var SymValue = function (a) {
        var value = scanEnv[a];
        return value;
    }

    var IsDefined = function (a) {
        return typeof cemeEnv.SymValue(a) !== 'undefined';
    }

    var Formatter = function () {
        // TODO check if typeof string
        var str = arguments[0];
        var i;
        for (i = 1; i < arguments.length; i++) {
            str = str.replace(/%s/, arguments[i].toString());
        }
        return str;
    }

    var IsResolution = function (a) {
        var re = /\s*[0-9]+\s*x\s*[0-9]+\s*/;
        return re.test(a);
    };
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

            'IsEqual': function (a, b) {
                return (a >= b && a <= b);
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

            // TODO rename

            'Cons': function (a, b) {
                if (IsEmptyArray(b))
                    return [a];
                if (IsEmptyArray(a))
                    return b;
                b.unshift(a);
                return b;
            },
            'Append': function (item, lst) {
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

            'Filter': function (f, arg) {
                return arg.filter(f);
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
            'Floor' : Math.floor,
            '%': function (a, b) {
                return a % b;
            },

            //////// Strings

            'Split': function (str, chr) {
                return str.split(chr);
            },
            'RemoveAll': function (str, chr) {
                return str.replace(new RegExp(ch, 'g'),'');
            },

            'Formatter': Formatter,
            'Print': function (a) {
                //console.log(a);
                return '';
            },

            'join': function(a, b) {
                return a.concat(b);
            },
            'Join': function(lst, delim) {
                var i;
                var result = '';
                result = lst[0];
                for (i = 1; i < lst.length; i++) {
                    result += delim;
                    result += lst[i];
                }
                return result;
            },
            // TODO add to String.prototype
            'StringStartsWith': function (x, start) {
                return (this.indexOf(start) > -1);
            },

            'MaxList': function (a) {
                var temp = cemeEnv['Reduce'](cemeEnv['Max'], a);
                return temp;
            },
            'MinList': function (a) {
                var temp = cemeEnv['Reduce'](cemeEnv['Min'], a);
                return temp;
            },
            'sum': sum,

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
            'EvalString': function (str) {
                return ceme.compile(str);
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
                return IsArray(a)
                    && a.length === 0; 
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

            /***************************
             * Scantuary
             **************************/
            //////// Sorting

            'SortNumbers': function (a) {
                var result;
                result = a.sort(function (b, c) { return b - c; });
                return result;
            },
            'SortStrings': function (a) {
                return a.sort();
            },
            'MaxwelSort': MaxwelSort,
            'MaxwelSortReverse': MaxwelSortReverse,

            'FirstWord': function (a) {
                var result = a.split(' ')[0];
                return result;
            },
            'Max': function (a, b) {
                if (a === "-") return b;
                if (b === "-") return a;
                if (a > b) {
                    return a;
                } else {
                    return b;
                }
            },
            'Min': function (a, b) {
                if (a === "-") return b;
                if (b === "-") return a;
                if (a < b) {
                    return a;
                } else {
                    return b;
                }
            },
            'MultipleOptions': function (a) {
                if (typeof a === 'string') {
                    return a.indexOf('/') > -1;
                }
                return false;
            },
            'SensibleName': function (a) {
                var re = /[a-zA-Z0-9]+/;
                if (a === '-') {
                    return false;
                } else if (cemeEnv.MultipleOptions(a)) {
                    return false;
                } else if (re.test(a)) {
                    return true;
                }
                throw Error('bad name: ' + a);
                return false;
            },
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
            'ReportError': function (msg) {
                if (typeof XMLHttpRequest !== 'undefined') {
                    var oRequest = new XMLHttpRequest();

                    oRequest.open('POST', '/errorReport', true);
                    oRequest.setRequestHeader('Content-type', 'text/plain');
                    oRequest.send(msg);

                    return oRequest.responseText;
                }
            },
            'Decommentify': function (a) {
                if (typeof a === "string") {
                    if (a.indexOf('(') > -1 && a.indexOf(')') > -1) {
                        a = a.replace(/\(.*\)/g, "");
                        a = a.trim();
                    }
                    if (!isNaN(a)) {
                        return parseFloat(a);
                    }
                }
                return a;
            },
            'SecurityCheckNumber': function (a) {
                if (typeof a === 'number') {
                    return a;
                } else {
                    throw "failed number security check";
                }
            },
            'DocWidth': function () {
                if (typeof exports === 'undefined') {
                    var width = $('#width-scale').width();
                    return width;
                } else {
                    return 1024;
                }
            },
            'ProductWithDashes': function (a) {
                return a.replace(/\s/g, '-');
            },
            'NumberWithCommas' : function (x) {
                var parts = x.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
            },
            'PriceCeil' : function (x) {
                return Math.ceil(x/500) * 500;
            },
            'PriceFloor' : function (x) {
                return Math.floor(x/500) * 500;
            },
            'ResolutionLines': function (a) {
                if (IsResolution(a)) {
                    var vals = a.split('x');
                    return Math.min(parseInt(vals[0]), parseInt(vals[1]));
                } else {
                    return '-';
                }
            },
            'ResolutionValue': function (a) {
                if (IsResolution(a)) {
                    var vals = a.split('x');
                    var result = parseInt(vals[0]) * parseInt(vals[1]);
                    return result;
                } else {
                    return 0;
                }
            },
            'WithoutUnknown': function (a) {
                return a.filter(function (b) {
                    return b !== '-';
                });
            },
            'IsResolution': IsResolution,
            'IsDefined': IsDefined,
            'SymValue': SymValue,

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

    var attributes = [ 'src', 'class', 'value', 'id', 'style', 'href', 'title', 'target' ];
    var i;
    for (i = 0; i < attributes.length; i++) {
        cemeEnv[attributes[i]] = attribute(attributes[i]);
    }

    // Self closing tags
    cemeEnv['hr'] = sctag('hr');
    cemeEnv['br'] = sctag('br');
    cemeEnv['img'] = sctagWithAttrib('img');

    // Open close tags
    var tags = [ 'div', 'p', 'a', 'ol', 'ul', 'li', 'span', 'script', 'button', 'table', 'thead', 'tbody',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'td', 'th', 'form', 'noscript', 'strong',
        'em', 'blockquote', 'cite', 'q', 'pre', 'code', 'body' ];
    for (i = 0; i < tags.length; i++) {
        cemeEnv[tags[i]] = tag(tags[i]);
    }
})();

(function(exports) {

    exports.cemeEnv = cemeEnv;

})(typeof exports === 'undefined'? this['lib']={}: exports);

