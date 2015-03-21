'use strict';

var clientSide = function () {
    return typeof exports === 'undefined';
}

if (!clientSide()) {
    var ceme = require('./ceme/compiler');
    var lib = require('./ceme/lib');
    var cemeEnv = lib.cemeEnv;
}

var cemeFileName = function () {
    var file = window.location.pathname.substr(1);
    if (file === '') {
        return 'home';
    } else {
        return file;
    }
}

// TODO use jquery.on instead
var onClickHandlers = function (a) {
    if (clientSide()) {
        $('a').unbind('click');
        $('a').click( function (e) {
            var url = $(this).attr("href");
            if (url && url[0] === '/') {
                $('#page-container').empty();
                history.pushState(null, null, url);

                e.preventDefault();
                setTimeout(function () {
                    Router.route(url);
                }, 0);
            }
        });
    }
}

cemeEnv.GetPageName = function () {
    var path = window.location.pathname;
    path = path.substr(1);
    if (path === '/') {
        return 'home';
    } else {
        return path;
    }
}

window.onpopstate = function (event) {
    Router.route(window.location.toString());
}

var xsrfToken = function () {
    return '&_xsrf=' + cemeEnv.GetCookie('_xsrf')
}

var queryObj = {};
function queryStringToJSON(queryString) {
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

$(document).on('submit', 'form', function (e) {
    // TODO not for GET forms
    var url = $(this).attr('action');
    if (url.indexOf('/api/') === 0) {
        e.preventDefault();
        $.ajax({
            url: url,
            type: 'POST',
            data: $(this).serialize() + xsrfToken(),
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status == 500) {
                    alert('Internal error: ' + jqXHR.responseText);
                } else {
                    alert('Unexpected error.');
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
});

$(document).on('click', '#logout', function() {
    $('#logout-form').submit();
});

$(document).on('click', '#ceme-btn-page', function() {
    $('#ceme-btn-page').addClass('active');
    $('#ceme-btn-code').removeClass('active');
    $('#ceme-code').hide();
    $('#ceme-output').fadeIn();
});

$(document).on('click', '#ceme-btn-code', function() {
    $('#ceme-btn-code').addClass('active');
    $('#ceme-btn-page').removeClass('active');
    $('#ceme-output').hide();
    $('#ceme-code').fadeIn();
});

var Router = function () {
    var makeEditor = function (elem) {
        var editor;
        var myCodeMirror = CodeMirror.fromTextArea(elem, {
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: false,
            extraKeys: {
                Tab: function(cm) {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            }
        });
        //myCodeMirror.setSize(550, 700);
        return myCodeMirror;
    }

    var route = function (url) {
        if (url.indexOf('?') > 0) {
            url = url.substr(url.indexOf('?'));
            queryObj = queryStringToJSON(url);
        }

        url = window.location.pathname;
        if (url === '/') {
            // TODO use redirect instead?
            url = '/home';
        }
        var temp = ceme.cemestart('/assets/code/home.ceme');
        $('#page-container').hide().html(temp).fadeIn(300);

        var mainarea = document.getElementById("ceme-input");

        var runCode = function () {
            var text = editor.getValue();
            try {
                var output = ceme.compile(text);
                $('#ceme-output').hide().html(output).fadeIn(300);
            } catch (err) {
                $('#alert').hide().html(cemeEnv.Alert(err.message, 'danger')).fadeIn(200);
                throw err;
            }

            var textareas = document.getElementsByClassName("ceme-editor");
            var i;
            for (i = 0; i < textareas.length; i++) {
                makeEditor(textareas[i]);
            }

        }

        $('#ceme-run').click(runCode);

        $('#ceme-history').click(function (e) {
            window.location = '/history?name=' + cemeEnv.GetPageName();
            e.preventDefault();
        });

        var text = ajaxRequest('/code' + url);

        var editor = makeEditor(mainarea);
        editor.setValue(text);
        runCode();

        if (document.cookie.indexOf('sodfksoihasg') > 0) {
            $('#login-logout').html('<li><a href="#" id="logout" >Log Out</a></li>');
        } else {
            $('#login-logout').html('<li><a href="/login">Login</a></li><li><a href="/sign-up">Sign Up</a></li>');
        }

        onClickHandlers();

    }
    return {
        'route': route
    }
}();

(function (exports) {
    exports.route = Router.route;

})(typeof exports === 'undefined'? {} : exports);
