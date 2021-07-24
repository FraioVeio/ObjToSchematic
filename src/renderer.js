const twgl = require('twgl.js');

const { Vector3 } = require('./vector.js');
const { Mesh } = require('./mesh.js');
const { ArcballCamera } = require('./camera.js');
const mouseManager = require('./mouse.js');
const shaderManager = require('./shaders.js');

class Renderer {

    constructor() {
        this._gl = document.querySelector("#c").getContext("webgl", {stencil: true});
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.enable(this._gl.CULL_FACE);
        this._gl.stencilOp(this._gl.KEEP, this._gl.KEEP, this._gl.REPLACE);
        this._gl.clearColor(0.0, 0.0, 0.0, 0.0);

        this._gl.blendFuncSeparate(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
        this._gl.enable(this._gl.BLEND);
        
        this._camera = new ArcballCamera(30, this._gl.canvas.clientWidth / this._gl.canvas.clientHeight, 0.5, 100.0);
        this._registerEvents();

        this._createOutlineTexture();
        this._createOutlineFramebuffer();
        
        this._createSceneTexture();
        this._createSceneFramebuffer();

        //this._time = 0.0;

        this._maxIndex = 0;
        this._register = {
            position: {numComponents: 3, data: []},
            normal: {numComponents: 3, data: []},
            indices: {numComponents: 3, data: []},
        };
        const mesh = new Mesh("./resources/suzanne.obj");
        for (const triangle of mesh.triangles) {
            const data = this._getTriangleData(triangle);
            this._addDataToRegister(data);
        }
        //this._register = twgl.primitives.createCubeVertices(2);
        this._buffer = twgl.createBufferInfoFromArrays(this._gl, this._register);
    }

    _getTriangleData(triangle) {
        const a = triangle.v0;
        const b = triangle.v1;
        const c = triangle.v2;
        const n = triangle.normal;

        return {
            position: [
                a.x, a.y, a.z,
                b.x, b.y, b.z,
                c.x, c.y, c.z,
            ],
            normal: [
                n.x, n.y, n.z,
                n.x, n.y, n.z,
                n.x, n.y, n.z
            ],
            indices: [
                0, 1, 2
            ]
        };
    }

    _addDataToRegister(data) {
        this._register.position.data.push(...data.position);
        this._register.normal.data.push(...data.normal);
        this._register.indices.data.push(...data.indices.map(x => x + this._maxIndex));

        this._maxIndex += 3;
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

    _createOutlineTexture() {
        // TODO: FIX
        this.textureWidth = 1920;
        this.textureHeight = 1080;
        //this.textureWidth = this._gl.canvas.width;
        //this.textureHeight = this._gl.canvas.height;

        this._outlineTexture = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._outlineTexture);
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

    _createSceneTexture() {
        // TODO: FIX
        this.textureWidth = 1920;
        this.textureHeight = 1080;
        //this.textureWidth = this._gl.canvas.width;
        //this.textureHeight = this._gl.canvas.height;

        this._sceneTexture = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._sceneTexture);
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

    _createOutlineFramebuffer() {
        this._outlineFramebuffer = this._gl.createFramebuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._outlineFramebuffer);

        const attachment = this._gl.COLOR_ATTACHMENT0;
        this._gl.framebufferTexture2D(
            this._gl.FRAMEBUFFER,
            attachment,
            this._gl.TEXTURE_2D,
            this._outlineTexture,
            0
        );
    }

    _createSceneFramebuffer() {
        this._sceneFramebuffer = this._gl.createFramebuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._sceneFramebuffer);

        const attachment = this._gl.COLOR_ATTACHMENT0;
        this._gl.framebufferTexture2D(
            this._gl.FRAMEBUFFER,
            attachment,
            this._gl.TEXTURE_2D,
            this._sceneTexture,
            0
        );

        const depthBuffer = this._gl.createRenderbuffer();
        this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, depthBuffer);
        this._gl.renderbufferStorage(this._gl.RENDERBUFFER,
            this._gl.DEPTH_COMPONENT16, 1920, 1080);
        this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, depthBuffer);
    }

    updateScene() {
        this._camera.aspect = this._gl.canvas.width / this._gl.canvas.height;
        this._camera.updateCameraPosition();
    }

    _allowColourDepthChanges(cond) {
        this._gl.colorMask(cond, cond, cond, cond);
        this._gl.depthMask(cond);
    }


    drawScene() {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.viewport(0, 0, 1920, 1080);

        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT | this._gl.STENCIL_BUFFER_BIT);
        
        
        // Fill the stencil buffer with 0s then add 1s for every fragment of the mesh
        this._gl.enable(this._gl.STENCIL_TEST);
        this._gl.stencilFunc(this._gl.ALWAYS, 1, 0xFF);                     // Write 1s in buffer when drawing
        this._gl.stencilMask(0xFF);                                         // Enable changes to the stencil
        this._allowColourDepthChanges(false);                               // Disable drawing to colour and depth buffers
        this._drawOutlinees(false);
        this._allowColourDepthChanges(true); 

        
        // Draw outline-object to outline texture
        this._gl.disable(this._gl.STENCIL_TEST);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._outlineFramebuffer);    // Draw to texture
        //this._gl.viewport(0, 0, this.textureWidth, this.textureHeight);     // TODO: necessary? hasn't changed
        //this._gl.enable(this._gl.DEPTH_TEST);                               // TODO: necessary? wasn't disabled
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._drawOutlinees(true);

        // Draw scene without stencil to scene texture
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._sceneFramebuffer);
        //this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.enable(this._gl.DEPTH_TEST); 
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        
        this._drawScene();

        // Draw to screen
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null); // Target the output framebuffer
        this._gl.disable(this._gl.DEPTH_TEST);
        //this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._drawSceneTextureToScreen();
        this._drawOutlineTextureToScreen();


        // Draw scene with stencil
        this._gl.enable(this._gl.STENCIL_TEST);
        this._gl.stencilFunc(this._gl.EQUAL, 1, 0xFF); // Only draw if stencil == 1
        this._gl.stencilMask(0x00); // Disable changes to the stencil
        this._drawSceneTextureToScreen();

        //this._time += 0.25;
    }

    _drawOutlinees(fill) {

        if (fill) {
            this._drawMeshFill([1.0, 0.0, 0.0], [0.0, 0.0, 0.0]);
            this._drawMeshFill([1.0, 0.0, 0.0], [2.0, 0.0, 0.0]);
        } else {
            this._drawMeshLit([0, 0, 0]);
            this._drawMeshFill([1.0, 0.0, 0.0], [2.0, 0.0, 0.0]);
        }
        
    }

    _drawScene() {
        this._drawMeshLit([-4, 0, 0]);
        this._drawMeshLit([-2, 0, 0]);
        this._drawMeshLit([0, 0, 0]);
        this._drawMeshLit([2, 0, 0]);
        this._drawMeshLit([4, 0, 0]);
    }

    _drawMeshFill(colour, translate) {
        const shader = shaderManager.fillProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, this._buffer);
        twgl.setUniforms(shader, {
            u_fillColour: colour,
            u_worldViewProjection: this._camera.getWorldViewProjection(),
            u_translate: translate,
        });
        this._gl.drawElements(this._gl.TRIANGLES, this._buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

    _drawMeshLit(translate) {
        const shader = shaderManager.litProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, this._buffer);
        twgl.setUniforms(shader, {
            u_lightWorldPos: [5, 2.5, 0],
            u_worldViewProjection: this._camera.getWorldViewProjection(),
            u_translate: translate,
        });
        this._gl.drawElements(this._gl.TRIANGLES, this._buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

    _drawOutlineTextureToScreen() {
        const plane = {
            position: {numComponents: 2, data: [-1, -1, 1, -1, 1, 1, -1, 1]},
            texcoord: {numComponents: 2, data: [0, 0, 1, 0, 1, 1, 0, 1]},
            indices: [0, 1, 2, 0, 2, 3]
        };
        const buffer = twgl.createBufferInfoFromArrays(this._gl, plane);

        const shader = shaderManager.blurProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, buffer);
        twgl.setUniforms(shader, {
            u_texture: this._outlineTexture
            //time: this._time
        });
        this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

    _drawSceneTextureToScreen() {
        const plane = {
            position: {numComponents: 2, data: [-1, -1, 1, -1, 1, 1, -1, 1]},
            texcoord: {numComponents: 2, data: [0, 0, 1, 0, 1, 1, 0, 1]},
            indices: [0, 1, 2, 0, 2, 3]
        };
        const buffer = twgl.createBufferInfoFromArrays(this._gl, plane);

        const shader = shaderManager.simpleProgram;
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, buffer);
        twgl.setUniforms(shader, {
            u_texture: this._sceneTexture
        });
        this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_SHORT, 0);
    }

}

module.exports.Renderer = Renderer;