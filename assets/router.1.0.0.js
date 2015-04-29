'use strict';

var clientSide = function () {
    return typeof exports === 'undefined';
}();

if (!clientSide) {
    var ceme = require('./ceme/compiler');
    var lib = require('./ceme/lib');
    var ceme = lib.ceme;
}

if (clientSide) {
    var cemeFileName = function () {
        var file = window.location.pathname.substr(1);
        if (file === '') {
            return 'home';
        }
        return file;
    };
}

ceme.GetPageName = function () {
    var path = window.location.pathname;
    path = path.substr(1);
    if (path === '') {
        return 'home';
    }
    return path;
};

var queryObj = {};

var Router = function () {
    var currentMode,
        editor;

    function queryStringToJSON(queryString) {
        var result = {},
            pairs;
        if (queryString.indexOf('?') > -1) {
            queryString = queryString.split('?')[1];
        }
        pairs = queryString.split('&');
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return result;
    }

    function xsrfToken() {
        return '&_xsrf=' + ceme.GetCookie('_xsrf');
    }

    function changeMode(mode) {
        currentMode = mode;
        $('.ceme-btn-page').removeClass('active');
        $('.ceme-btn-code').removeClass('active');
        $('.ceme-btn-both').removeClass('active');
        //editor.refresh();
        if (mode === 'view') {
            $('.ceme-btn-page').addClass('active');
            $('#ceme-code').hide();
            $('#ceme-output').fadeIn();
            $('#ceme-code').hide();
            $('#ceme-output').fadeIn();
        } else if (mode === 'edit') {
            $('.ceme-btn-code').addClass('active');
            $('#ceme-output').hide();
            $('#ceme-code').fadeIn();
        } else if (mode === 'both') {
            $('.ceme-btn-both').addClass('active');
            $('#ceme-output').fadeIn();
            $('#ceme-code').fadeIn();
        }
        editor.resize();
    }

    function makeEditor(elem) {
        /*
        var myCodeMirror = CodeMirror.fromTextArea(elem, {
            lineNumbers: true,
            mode: "text/html",
            tabSize: 4,
            indentUnit: 4,
            vimMode: false,
            extraKeys: {
                "Tab": "indentMore",
                "Shift-Tab": "indentLess",
                "Shift-Ctrl-Up": "swapLineUp",
                "Shift-Ctrl-Down": "swapLineDown"
            }
        });
        */
        //myCodeMirror.setSize(550, 700);
        return myCodeMirror;
    }

    function runCode() {
        var text,
            textareas,
            i,
            outputelem;
        text = editor.getValue();
        $('#alert').hide();
        outputelem = $('#ceme-output');
        outputelem.empty();

        cemeCompiler.asyncCompiler('', {
            callback: function (code, output) {
                outputelem.html(output).fadeIn(300);
                if (currentMode === 'edit') {
                    changeMode('view');
                }
            },
            code: text
        });

        textareas = document.getElementsByClassName("ceme-editor");
        for (i = 0; i < textareas.length; i += 1) {
            makeEditor(textareas[i]);
        }
    }

    if (clientSide) {
        $(document).on('submit', 'form', function (e) {
            $("#ceme-input").val(editor.getSession().getValue());

            // TODO not for GET forms
            var url = $(this).attr('action');
            if ($(this).attr('method') === 'post') {
                if (url.indexOf('/api') === 0) {
                    e.preventDefault();
                    $.ajax({
                        url: url,
                        type: 'POST',
                        data: $(this).serialize() + xsrfToken(),
                        error: function (jqXHR) {
                            if (jqXHR.status === 0) {
                                cemeCompiler.error('No internet connection');
                            } else if (jqXHR.status === 500) {
                                cemeCompiler.error('Internal server error');
                            } else if (jqXHR.status === 404) {
                                cemeCompiler.error(jqXHR.responseText);
                            } else if (jqXHR.status === 400) {
                                cemeCompiler.error(jqXHR.responseText);
                            } else {
                                cemeCompiler.error('Unexpected error status:' + jqXHR.status);
                            }
                        }
                    }).done(function (response) {
                        $('#alert').hide().html(ceme.Alert(response, 'success')).fadeIn(200);
                    });
                } else {
                    var input = $("<input>")
                        .attr("type", "hidden")
                        .attr("name", "_xsrf").val(ceme.GetCookie('_xsrf'));
                    $(this).append(input);
                }
            }
        });

        $(document).on('click', '#logout', function () {
            $('#logout-form').submit();
        });

        $(document).on('click', '.ceme-btn-page', function () {
            changeMode('view');
        });

        $(document).on('click', '.ceme-btn-code', function () {
            changeMode('edit');
        });

        $(document).on('click', '.ceme-btn-both', function () {
            changeMode('both');
        });

        $(document).on('click', '#ceme-run', runCode);

        $(document).on('click', '#ceme-history', function (e) {
            window.location = '/history?name=' + ceme.GetPageName();
            e.preventDefault();
        });

        $(document).on('click', 'a', function (e) {
            function external (url) {
                return /^(http|#)/.test(url);
            }
            var url = $(this).attr("href");
            if (url && !external(url)) {
                history.pushState(null, null, url);

                e.preventDefault();
                setTimeout(function () {
                    Router.route(url);
                }, 0);
            }
        });
    }

    function firstLoad() {
        cemeCompiler.asyncCompiler('/assets/code/home.1.0.0.ceme', {
            callback: function (code, output) {
                $('body').show();
                $('#page-container').hide().html(output).fadeIn(300);

                /*
                var mainarea = document.getElementById("ceme-input");
                editor = makeEditor(mainarea);
                */
                editor = ace.edit("ceme-ace-editor");

                $("#mobile-menu").mmenu({
                    "extensions": [
                    "border-none",
                    "effect-slide",
                    "padeshadow"
                    ],
                    onClick: {
                        close: true
                    }
                });

                Router.route(window.location.pathname + window.location.search);

            }
        });
    }


    function route(url) {
        var loc,
            pagename;
        if (url[0] === '/') {
            url = url.substr(1);
        }
        loc = url.split('?');
        if (loc[1]) {
            queryObj = queryStringToJSON(loc[1]);
        }
        pagename = loc[0];
        if (pagename === '') {
            pagename = 'home';
        }

        $('#ceme-page-name').replaceWith('<input type="hidden" name="name" id="ceme-page-name" value="' + pagename + '">');
        cemeCompiler.asyncCompiler('/code/' + pagename, {
            callback: function (code, output) {

                runCode();

                hljs.configure({
                    languages: ['ceme']
                });
                $('pre code').each(function (i, block) {
                    hljs.highlightBlock(block);
                });

                if (document.cookie.indexOf('ofhbjpodsfasiohs') > 0) {
                    $('.login-logout').html('<li><a href="#" id="logout" >Log Out</a></li>');
                } else {
                    $('.login-logout').html('<li><a href="/login">Login</a></li><li><a href="/sign-up">Sign Up</a></li>');
                }
            },
            callbackbeforecompile: function (code) {
                // runs before compilation
                //editor.setValue(code);
                editor.getSession().setMode("ace/mode/ceme");
                editor.setOption('maxLines', Infinity);
                editor.setOption('minLines', 3);
                editor.setFontSize(18);
                editor.setTheme("ace/theme/github");
                editor.$blockScrolling = Infinity;
                editor.setValue(code);
                changeMode('view');
            }
        });

    }
    return {
        'route': route,
        'firstLoad': firstLoad,
        'runCode': runCode
    };
}();

if (clientSide) {
    window.onpopstate = function () {
        Router.route(window.location.pathname + window.location.search);
    };
}

(function (exports) {
    exports.route = Router.route;

})(typeof exports === 'undefined' ? {} : exports);
