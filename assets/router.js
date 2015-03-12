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

var queryString = {};
var Router = function () {
    var route = function (url) {
        url.replace(new RegExp("([^?=&]+)(=([^&]*))?", "g"),
                        function($0, $1, $2, $3) { queryString[$1] = $3; });

        url = window.location.pathname;
        if (url === '/') {
            // TODO use redirect instead?
            url = '/home';
        }
        var temp = ceme.cemestart('/assets/code/home.ceme');
        $('#page-container').hide().html(temp).fadeIn(300);

        var runCode = function () {
            var text = $('#ceme-input').val();
            $('#ceme-output').hide().html(ceme.compile(text)).fadeIn(300);
        }
        $('#ceme-run').click(runCode);

        $('#ceme-save').click(function (e) {
            runCode();
            e.preventDefault();
            $.ajax({
                url: '/save',
                type: 'POST',
                data: $('#submit-form').serialize() + xsrfToken(),
            }).done(function (response) {
                $('#alert').hide().html(cemeEnv.Alert(response, 'success')).fadeIn(200);
            }).fail(function () {
                $('#alert').hide().html(cemeEnv.Alert('Your changes could not be saved', 'danger')).fadeIn(200);
            });
        });
        $('#ceme-history').click(function (e) {
            window.location = '/history?name=' + cemeEnv.GetPageName();
            e.preventDefault();
        });

        var text = ajaxRequest('/code' + url);
        $('#ceme-input').val(text);
        runCode();

        if (document.cookie.indexOf('sodfksoihasg') > 0) {
            $('#login-logout').html('<li><a href="/logout">Logout</a></li>');
        } else {
            $('#login-logout').html('<li><a href="/login">Login</a></li>');
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
