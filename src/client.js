const { Renderer } = require('./src/renderer.js');
const mouseManager = require('./src/mouse.js');

const renderer = new Renderer();
const canvas = document.querySelector("#c");

let isContextMenuOpen = false;

canvas.addEventListener('click', (e) => {
    $("#right-click-menu").css("visibility", "hidden");
});

canvas.addEventListener('contextmenu', (e) => {
    $("#right-click-menu").css("left", e.clientX);
    $("#right-click-menu").css("top", e.clientY);
    $("#right-click-menu").css("visibility", "visible");
});

function render(time) {

    if (mouseManager.isMouseLeftDown()) {
        console.log("down");
        $("#right-click-menu").css("visibility", "hidden");
    }

    renderer.updateScene();
    renderer.drawScene();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);