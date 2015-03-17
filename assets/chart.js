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

var drawanimation = function (ts) {
    timescalled++;
    if (timescalled === 100) {
        timescalled = 0;
        var delta = new Date().getTime() - lasttimecalled;
        fps = 100/delta * 1000;
        //console.log(fps);
        lasttimecalled = Date.now();
    }

    var ctx = document.getElementById('canvas').getContext('2d');
    if (ctx) {

        if (typeof starttime === 'undefined') {
            starttime = ts;
        }
        time = ts - starttime - 2000;


        ctx.fillStyle = "red";
        ctx.fillRect(10,10,50,50);

        if (time > 14000) {
            starttime = ts;
        }
    }

    // runs for 9 secs
    window.requestAnimationFrame(drawanimation);
}

window.requestAnimationFrame(drawanimation);
