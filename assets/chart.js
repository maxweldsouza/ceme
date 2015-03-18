// Custom made for ceme

(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
    window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

var lasttimecalled = Date.now();
var timescalled = 0;

var ctx;
var drawanimation = function (ts) {
    timescalled++;
    if (timescalled === 100) {
        timescalled = 0;
        var delta = new Date().getTime() - lasttimecalled;
        fps = 100/delta * 1000;
        //console.log(fps);
        lasttimecalled = Date.now();
    }

    var canvas = document.getElementById('canvas');

    if (canvas) {
        ctx = canvas.getContext('2d');

        if (typeof starttime === 'undefined') {
            starttime = ts;
        }
        time = ts - starttime - 2000;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // defaults
        ctx.fillStyle = "red";

        cemeEnv.Special();

        if (time > 14000) {
            starttime = ts;
        }
    }

    window.requestAnimationFrame(drawanimation);
}

window.requestAnimationFrame(drawanimation);

cemeEnv.Text = function(txt, x, y, color, font) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
}

cemeEnv.Rectangle = function (w, h, l, t) {
    ctx.fillRect(w, h, l, t);
}

cemeEnv.Circle = function (x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fill();
}

