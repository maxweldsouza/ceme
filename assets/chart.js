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
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // defaults
        ceme.Special();

        if (time > 14000) {
            starttime = ts;
        }
    }

    window.requestAnimationFrame(drawanimation);
}

window.requestAnimationFrame(drawanimation);

// Properties
ceme.LineWidth = function (x) {
    ctx.lineWidth = x;
}

ceme.LineJoin = function (x) {
    ctx.lineJoin = x;
}

ceme.StrokeStyle = function (color) {
    ctx.strokeStyle = color;
}

ceme.FillStyle = function (color) {
    ctx.fillStyle = color;
}

ceme.LineCap = function (cap) {
    ctx.lineCap(cap);
}

// Lines
ceme.Line = function (x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

ceme.Arc = function (x, y, radius, startAngle, endAngle, counterClockwise) {
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    ctx.stroke();
}

ceme.QuadraticCurve = function (x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x2, y2, x3, y3);
    ctx.stroke();
}

ceme.BezierCurve = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x2, y2, x3, y3, x4, y4);
    ctx.stroke();
}

ceme.DrawImage = function (src, x, y, w, h) {
    var image = new Image();
    image.onload = function () {
        ctx.drawImage(image, x, y, w, h);
    }
    image.src = src;
}

// Shapes
ceme.Rectangle = function (w, h, l, t) {
    ctx.fillRect(w, h, l, t);
}

ceme.Circle = function (x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.fill();
}

// Text
ceme.Text = function(txt, x, y) {
    ctx.fillText(txt, x, y);
}

ceme.TextAlign = function (align) {
    ctx.textAlign = align;
}

ceme.VerticalBaseline = function (align) {
    ctx.verticalBaseline = align;
}

ceme.Font = function (font) {
    ctx.font = font;
}

// Transformations
ceme.Translate = function (x, y) {
    ctx.translate(x, y);
}

ceme.Scale = function (x, y) {
    ctx.scale(x, y);
}

ceme.Rotate = function (turns) {
    ctx.rotate(2 * Math.PI * turns);
}

ceme.ResetTransform = function (x, y) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

ceme.GlobalAlpha = function (alpha) {
    ctx.alpha = alpha;
}

ceme.SaveTransform = function () {
    ctx.save();
}
ceme.RestoreTransform = function () {
    ctx.restore();
}
