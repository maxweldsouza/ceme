'use strict';

var clientSide = function () {
    return typeof exports === 'undefined';
}

if (!clientSide()) {
    var ceme = require('./ceme/compiler');
    var lib = require('./ceme/lib');
    var cemeEnv = lib.cemeEnv;
}

var onClickHandlers = function (a) {
    if (clientSide()) {
        $('a').unbind('click');
        $('a').click( function (e) {
            var url = $(this).attr("href");
            if (url[0] === '/') {
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

var Router = function () {
    var route = function (url) {
        if (url === '/') {
            url = '/home';
        }
        var temp = ceme.cemestart('/assets/code/home.ceme');
        $('#page-container').replaceWith(temp);

        var runCode = function () {
            var text = $('#ceme-input').val();
            $('#ceme-output').html(ceme.compile(text));
        }
        $('#ceme-run').click(runCode);

        var text = ajaxRequest('/assets/demos/' + url + '.ceme');
        $('#ceme-input').val(text);
        runCode();

        onClickHandlers();
    }
    return {
        'route': route
    }
}();

(function (exports) {
    exports.route = Router.route;

})(typeof exports === 'undefined'? {} : exports);
