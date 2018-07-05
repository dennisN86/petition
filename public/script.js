const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const submit = $("#submit");
const clear = $("#clear");
const hiddenInput = $("#hidden-input");

canvas.mousedown(function(e) {
    var mouseX = e.pageX - $(this).offset().left;
    var mouseY = e.pageY - $(this).offset().top;

    paint = true;
    addClick(e.pageX - $(this).offset().left, e.pageY - $(this).offset().top);
    redraw();
});

canvas.mousemove(function(e) {
    if (paint) {
        addClick(
            e.pageX - $(this).offset().left,
            e.pageY - $(this).offset().top,
            true
        );
        redraw();
    }
});

canvas.mouseup(function() {
    // hiddenInput.val(canvas[0].toDataURL());
    paint = false;
    redraw();
});

canvas.mouseleave(function() {
    paint = false;
});

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint;

function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
}

function redraw() {
    ctx.strokeStyle = "red";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

    for (var i = 0; i < clickX.length; i++) {
        ctx.beginPath();
        if (clickDrag[i] && i) {
            ctx.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            ctx.moveTo(clickX[i] - 1, clickY[i]);
        }
        ctx.lineTo(clickX[i], clickY[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

clear.click(function() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    clickX = [];
    clickY = [];
    canvas.value = "";
});

submit.click(function() {
    hiddenInput.val(canvas[0].toDataURL());
});
