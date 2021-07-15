const twgl = require('twgl.js');

const { Vector3 } = require('./vector.js');
const { ArcballCamera } = require('./camera.js');
const mouseManager = require('./mouse.js');
const shaderManager = require('./shaders.js');

class Renderer {

    constructor() {
        this._gl = document.querySelector("#c").getContext("webgl");
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.enable(this._gl.CULL_FACE);
        this._gl.clearColor(0.1, 0.1, 0.1, 1.0);
        
        this._camera = new ArcballCamera(30, this._gl.canvas.clientWidth / this._gl.canvas.clientHeight, 0.5, 100.0);
        this._registerEvents();

        this._createTexture();
        this._createFrameBuffer();
    }

    _registerEvents() {
        this._gl.canvas.addEventListener('mousedown', (e) => {
            this._camera.isRotating = true;
        });
    
        this._gl.canvas.addEventListener('mouseup', (e) => {
            this._camera.isRotating = false;
        });
    
        this._gl.canvas.addEventListener('mousemove', (e) => {
            mouseManager.handleInput(e);
            this._camera.updateCamera();
        });
    
        this._gl.canvas.addEventListener('wheel', (e) => {
            this._camera.handleScroll(e);
        });
    }

    _createTexture() {
        // TODO: FIX
        this.textureWidth = 1920;
        this.textureHeight = 1080;
        //this.textureWidth = this._gl.canvas.width;
        //this.textureHeight = this._gl.canvas.height;

        this._texture = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.RGBA,
            this.textureWidth,
            this.textureHeight,
            0,
            this._gl.RGBA,
            this._gl.UNSIGNED_BYTE,
            null
        );
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
    }

    _createFrameBuffer() {
        this._framebuffer = this._gl.createFramebuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

        const attachment = this._gl.COLOR_ATTACHMENT0;
        this._gl.framebufferTexture2D(
            this._gl.FRAMEBUFFER,
            attachment,
            this._gl.TEXTURE_2D,
            this._texture,
            0
        );
    }

    updateScene() {
        this._camera.aspect = this._gl.canvas.width / this._gl.canvas.height;
        this._camera.updateCameraPosition();
    }

    drawScene() {
        
        // Render to texture
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
        this._gl.viewport(0, 0, this.textureWidth, this.textureHeight);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._drawCube([1.0, 0.0, 0.0], 1.0);

        // Render to canvas
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.viewport(0, 0, 1920, 1080);
        this._drawTextureToScreen();
    }


    _drawCube(colour, scale) {
        const cube = twgl.primitives.createCubeVertices(2);
        const buffer = twgl.createBufferInfoFromArrays(this._gl, cube);

        const shader = shaderManager.redProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, buffer);
        twgl.setUniforms(shader, {
            u_fillColour: colour,
            u_scale: scale,
            u_worldViewProjection: this._camera.getWorldViewProjection()
        });
        this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

    _drawTextureToScreen() {
        const plane = {
            position: {numComponents: 2, data: [-1, -1, 1, -1, 1, 1, -1, 1]},
            texcoord: {numComponents: 2, data: [0, 0, 1, 0, 1, 1, 0, 1]},
            indices: [0, 1, 2, 0, 2, 3]
        };
        const buffer = twgl.createBufferInfoFromArrays(this._gl, plane);

        const shader = shaderManager.shadedProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, buffer);
        twgl.setUniforms(shader, {
            u_texture: this._texture
        });
        this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

}

module.exports.Renderer = Renderer;