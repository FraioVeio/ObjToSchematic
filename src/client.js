const { Renderer } = require('./src/renderer.js');

const renderer = new Renderer();

function render(time) {
    renderer.updateScene();
    renderer.drawScene();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);