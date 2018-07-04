const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const submit = $("#submit");
const clear = $("#clear");

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

canvas.mouseup(function(e) {
    paint = false;
    redraw();
});

canvas.mouseleave(function(e) {
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
    // 0, 0 will adept to the canvas size and clears it
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = "#df4b26";
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;

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
// canvas.toDataURL(); // listener needed for mousedown(begin path), mousemove(stroke), mouseup(canvas toDataURL)
