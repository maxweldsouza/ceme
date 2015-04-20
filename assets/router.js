'use strict';

var clientSide = function () {
    return typeof exports === 'undefined';
}();

if (!clientSide) {
    var ceme = require('./ceme/compiler');
    var lib = require('./ceme/lib');
    var cemeEnv = lib.cemeEnv;
}

if (clientSide) {
    var cemeFileName = function () {
        var file = window.location.pathname.substr(1);
        if (file === '') {
            return 'home';
        } else {
            return file;
        }
    }
}

cemeEnv.GetPageName = function () {
    var path = window.location.pathname;
    path = path.substr(1);
    if (path === '') {
        return 'home';
    } else {
        return path;
    }
}

if (clientSide) {
    window.onpopstate = function (event) {
        Router.route(window.location.pathname + window.location.search);
    }
}

var queryObj = {};

var Router = function () {
    var queryStringToJSON = function (queryString) {
        if(queryString.indexOf('?') > -1){
            queryString = queryString.split('?')[1];
        }
        var pairs = queryString.split('&');
        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return result;
    }

    var xsrfToken = function () {
        return '&_xsrf=' + cemeEnv.GetCookie('_xsrf')
    }

    var runCode = function () {
        var text = editor.getValue();
        $('#alert').hide();
        var outputelem = $('#ceme-output');
        outputelem.empty();

        ceme.asyncCompiler('', {
            callback: function (code, output) {
                outputelem.html(output).fadeIn(300);
                if (currentMode === 'edit') {
                    changeMode('view');
                }
            },
            code: text,
        });

        try {
        } catch (err) {
            $('#alert').hide().html(cemeEnv.Alert(err.message, 'danger')).fadeIn(200);
        }

        var textareas = document.getElementsByClassName("ceme-editor");
        var i;
        for (i = 0; i < textareas.length; i++) {
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
                        error: function (jqXHR, textStatus, errorThrown) {
                            if (jqXHR.status === 0) {
                                ceme.error('No internet connection');
                            } else if (jqXHR.status == 500) {
                                ceme.error('Internal server error');
                            } else if (jqXHR.status == 404) {
                                ceme.error(jqXHR.responseText);
                            } else if (jqXHR.status == 400) {
                                ceme.error(jqXHR.responseText);
                            } else {
                                ceme.error('Unexpected error status:' + jqXHR.status);
                            }
                        }
                    }).done(function (response) {
                        $('#alert').hide().html(cemeEnv.Alert(response, 'success')).fadeIn(200);
                    });
                } else {
                    var input = $("<input>")
                              .attr("type", "hidden")
                              .attr("name", "_xsrf").val(cemeEnv.GetCookie('_xsrf'));
                    $(this).append(input);
                }
            }
        });

        $(document).on('click', '#logout', function() {
            $('#logout-form').submit();
        });

        $(document).on('click', '.ceme-btn-page', function() {
            changeMode('view');
        });

        $(document).on('click', '.ceme-btn-code', function() {
            changeMode('edit');
        });

        $(document).on('click', '.ceme-btn-both', function() {
            changeMode('both');
        });

        $(document).on('click', '#ceme-run', runCode);

        $(document).on('click', '#ceme-history', function (e) {
            window.location = '/history?name=' + cemeEnv.GetPageName();
            e.preventDefault();
        });

        $(document).on('click', 'a', function (e) {
            var url = $(this).attr("href");
            if (url && url[0] === '/') {
                history.pushState(null, null, url);

                e.preventDefault();
                setTimeout(function () {
                    Router.route(url);
                }, 0);
            }
        });
    }

    var makeEditor = function (elem) {
        var editor;
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

    var currentMode;
    var changeMode = function(mode) {
        currentMode = mode;
        $('.ceme-btn-page').removeClass('active');
        $('.ceme-btn-code').removeClass('active');
        $('.ceme-btn-both').removeClass('active');
        //editor.refresh();
        if (mode === 'view') {
            $('.ceme-btn-page').addClass('active');
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

    var editor;

    var firstLoad = function() {
        ceme.asyncCompiler('/assets/code/home.ceme', {
            callback: function (code, output) {
                $('body').show();
                $('#page-container').hide().html(output).fadeIn(300);

                /*
                var mainarea = document.getElementById("ceme-input");
                editor = makeEditor(mainarea);
                */
                editor = ace.edit("ceme-ace-editor");

                $("#mobile-menu").mmenu({
                    onClick: {
                        close: true
                    }
                });

                Router.route(window.location.pathname + window.location.search);

            }
        });
    }

    var route = function (url) {
        url = url.substr(1);
        var loc = url.split('?');
        if (loc[1]) {
            queryObj = queryStringToJSON(loc[1]);
        }
        var pagename = loc[0];
        if (pagename === '') {
            pagename = 'home';
        }

        $('#ceme-page-name').replaceWith('<input type="hidden" name="name" id="ceme-page-name" value="' + pagename + '">');
        ceme.asyncCompiler('/code/' + pagename, {
            callback: function (code, output) {

                runCode();

                hljs.configure({
                    languages: ['ceme']
                });
                $('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                });

                if (document.cookie.indexOf('sodfksoihasg') > 0) {
                    $('.login-logout').html('<li><a href="#" id="logout" >Log Out</a></li>');
                } else {
                    $('.login-logout').html('<li><a href="/login">Login</a></li><li><a href="/sign-up">Sign Up</a></li>');
                }
            },
            callbackbeforecompile: function (code) {
                // runs before compilation
                //editor.setValue(code);
                editor.getSession().setMode("ace/mode/ceme");
                editor.setOption('maxLines', 40);
                editor.setOption('minLines', 3);
                editor.setFontSize(18);
                editor.setTheme("ace/theme/clouds");
                editor.setValue(code);
                editor.$blockScrolling = Infinity;
                changeMode('view');
            }
        });

        try {
        } catch (err) {
            $('#alert').hide().html(cemeEnv.Alert(err.message, 'danger')).fadeIn(200);
        }

    }
    return {
        'route': route,
        'firstLoad': firstLoad,
        'runCode': runCode
    }
}();

(function (exports) {
    exports.route = Router.route;

})(typeof exports === 'undefined'? {} : exports);
