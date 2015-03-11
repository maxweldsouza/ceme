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

window.onpopstate = function (event) {
    Router.route(window.location.pathname);
}

var xsrfToken = function () {
    return '&_xsrf=' + cemeEnv.GetCookie('_xsrf')
}

var Router = function () {
    var route = function (url) {
        if (url === '/') {
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
