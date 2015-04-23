var cemeEnv,
    IsArray;
(function () {
    "use strict";

    // Polyfills
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (searchString, position) {
            var subjectString = this.toString(),
                lastIndex;
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        };
    }

    cemeEnv = (function () {
        function IsEmptyArray(tree) {
            return IsArray(tree) && tree.length === 0;
        }

        // Arrays
        function First(list) {
            if (IsEmptyArray(list)) {
                throw new Error('Cant get first of empty array ' + list);
            }
            if (cemeEnv.IsAtom(list)) {
                throw new Error('Cant get first of atom ' + list);
            }
            return list[0];
        }

        function Rest(list) {
            if (IsEmptyArray(list)) {
                throw new Error('Cant Rest an empty array: ' + list);
            }
            if (cemeEnv.IsAtom(list)) {
                throw new Error('Cant Rest an atom: ' + list);
            }
            return list.slice(1, list.length);
        }

        //TODO duplicate
        if (IsArray === undefined) {
            IsArray = function (a) {
                return Object.prototype.toString.call(a) === '[object Array]';
            };
        }

        function IsLat(a) {
            var i;
            if (!IsArray(a)) {
                return false;
            }
            for (i = 0; i < a.length; i += 1) {
                if (IsArray(a[i])) {
                    return false;
                }
            }
            return true;
        }

        function IndexOf(x, lst) {
            var i;
            for (i = 0; i < lst.length; i += 1) {
                if (lst[i] === x) {
                    return i;
                }
            }
            return -1;
        }

        function SplitIntoArraysOfSize(lst, no) {
            var result = [],
                sublst = [],
                i;
            for (i = 0; i < lst.length; i += 1) {
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
        function RandomInt(l, u) {
            return Math.floor((Math.random() * u) + l);
        }

        function Formatter(str) {
            console.log('Dont use formatter, use format instead');
            var i;
            for (i = 1; i < arguments.length; i += 1) {
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
                $('head').append(description);
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

            '*': function (a) {
                var i,
                    result = a;
                for (i = 1; i < arguments.length; i += 1) {
                    result *= arguments[i];
                }
                return result;
            },
            '/': function (a) {
                var i,
                    result = a;
                for (i = 1; i < arguments.length; i += 1) {
                    result /= arguments[i];
                }
                return result;
            },
            '+': function (a) {
                var i,
                    result = a;
                for (i = 1; i < arguments.length; i += 1) {
                    result += arguments[i];
                }
                return result;
            },
            '-': function (a) {
                var i,
                    result = a;
                for (i = 1; i < arguments.length; i += 1) {
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
                x = x - Math.floor(x);
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
                }
                return lst[n];
            },
            'IndexOf': IndexOf,

            //////// Functional

            'Map': function (f, lst) {
                var result = [],
                    i;
                for (i = 0; i < lst.length; i += 1) {
                    result.push(f(lst[i]));
                }
                return result;
            },

            'Reduce': function (f, lst) {
                var result = lst[0],
                    i;
                if (lst.length === 0) {
                    return lst;
                }
                for (i = 1; i < lst.length; i += 1) {
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
                for (i = 0; i < no; i += 1) {
                    f();
                }
            },

            //////// Sets

            'MakeSet': function (x) {
                var result = [],
                    i;
                for (i = 0; i < x.length; i += 1) {
                    if (!cemeEnv.IsMember(x[i], result)) {
                        result.push(x[i]);
                    }
                }
                return result;
            },
            'IntersectSets': function (x, y) {
                var result = [],
                    i;
                for (i = 0; i < x.length; i += 1) {
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
                var lst = [],
                    i;
                for (i = a; i <= b; i += 1) {
                    lst.push(i);
                }
                return lst;
            },
            'ParseInt': function (a) {
                return parseInt(a, 10);
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
            'Join': function (lst, delim) {
                return lst.join(delim);
            },
            'Formatter': Formatter,
            'Format': function (str) {
                var args = arguments;
                str = str.replace(/\{\{|\}\}|\{(\d+)\}/g, function (x, i) {
                    if (x === '{{') {
                        return '{';
                    }
                    if (x === '}}') {
                        return '}';
                    }
                    i = Number(x[1]) + 1;
                    if (i >= args.length) {
                        throw new Error('Too few arguments for format string');
                    }
                    return args[i];
                });
                return str;
            },

            'MaxList': function (a) {
                var temp = cemeEnv.Reduce(cemeEnv.Max, a);
                return temp;
            },
            'MinList': function (a) {
                var temp = cemeEnv.Reduce(cemeEnv.Min, a);
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
            'MapCar': function (fn, lst) {
                var i, j,
                    result = [],
                    args;
                for (i = 0; i < lst[0].length; i += 1) {
                    args = [];
                    for (j = 0; j < lst.length; j += 1) {
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
                    'blockquote,cite,pre,code,body,q,p,a'),
                'Builtin': '+,-,*,/',
                'Keywords': ('define,function,unnamed,while,' +
                    'import,let,list,function,if,apply'),
                'Literals': 'true,false'
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
                var result = [],
                    i;
                for (i = 0; i < lst.length; i += 1) {
                    if (fn(lst[i])) {
                        result.push(i);
                    }
                }
                return result;
            },

            /* get the ids of the elements of the array which pass
            the given condition */
            'FilterKeys': function (fn, lst, keys) {
                var result = [],
                    i;
                for (i = 0; i < lst.length; i += 1) {
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
                for (i = 0; i < lst.length; i += 1) {
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
            'GetCookie': function (name) {
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
                    success: function (data) {
                        temp = data;
                    }
                });
                return temp;
            },
            //////// Sorting

            'SortNumbers': function (a) {
                var result;
                result = a.sort(function (b, c) {
                    return b - c;
                });
                return result;
            },
            'SortStrings': function (a) {
                return a.sort();
            },

            /***************************
             * Scantuary
             **************************/
            'ItemsAt': function (x, ids) {
                var result = [],
                    i;
                for (i = 0; i < ids.length; i += 1) {
                    result.push(x[ids[i]]);
                }
                return result;
            },
            'ItemWithIds': function (x, ids, target) {
                var result = [],
                    ind,
                    i;
                for (i = 0; i < target.length; i += 1) {
                    ind = IndexOf(target[i], ids);
                    if (ind !== -1) {
                        result.push(x[ind]);
                    }
                }
                return result;
            },

            'SplitIntoArraysOfSize': SplitIntoArraysOfSize,
            'SplitInto': function (lst, no) {
                var elemsperlist = Math.ceil(lst.length / no);
                return SplitIntoArraysOfSize(lst, elemsperlist);
            }
        };
    }());

    (function () {
        var tags,
            attributes;
        /* Html */

        function Attrib(value) {
            this.value = value;
        }

        function open(a, atr) {
            return '<' + a + atr + '>';
        }

        function close(a) {
            return '</' + a + '>';
        }

        function tag(a) {
            return function () {
                var i,
                    result = '',
                    atr = '';
                for (i = 0; i < arguments.length; i += 1) {
                    if (arguments[i] instanceof Attrib) {
                        atr += arguments[i].value;
                    } else {
                        result += arguments[i];
                    }
                }
                return open(a, atr) + result + close(a);
            };
        }

        function sctag(a) {
            var atr = '',
                i;
            for (i = 0; i < arguments.length; i += 1) {
                if (arguments[i] instanceof Attrib) {
                    atr += arguments[i].value;
                }
            }
            return '<' + a + atr + '/>';
        }

        function sctagWithAttrib(a) {
            return function () {
                var atr = '',
                    i;
                for (i = 0; i < arguments.length; i += 1) {
                    if (arguments[i] instanceof Attrib) {
                        atr += arguments[i].value;
                    }
                }
                return '<' + a + atr + '/>';
            };
        }
        cemeEnv.attrib = function () {
            var result = '',
                i;
            for (i = 0; i < arguments.length; i += 1) {
                result += arguments[i];
            }
            return new Attrib(result);
        };

        function attribute(a) {
            return function (b) {
                return ' ' + a + '="' + b + '" ';
            };
        }

        // Attributes
        cemeEnv.type = attribute('type');

        attributes = ('src,class,value,id,style,' +
            'href,title,target').split(',');

        // Self closing tags
        cemeEnv.hr = sctag('hr');
        cemeEnv.br = sctag('br');
        cemeEnv.img = sctagWithAttrib('img');

        tags = cemeEnv.CemeLanguage.HtmlTags.split(',');

        (function () {
            var i;
            for (i = 0; i < attributes.length; i += 1) {
                cemeEnv[attributes[i]] = attribute(attributes[i]);
            }
            for (i = 0; i < tags.length; i += 1) {
                cemeEnv[tags[i]] = tag(tags[i]);
            }
        }());

    }());

    /*
    (function(exports) {

        exports.cemeEnv = cemeEnv;

    })(typeof exports === 'undefined'? this['lib']={}: exports);
    */

}());
