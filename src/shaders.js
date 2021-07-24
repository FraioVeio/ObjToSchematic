const twgl = require('twgl.js');
const fs = require('fs');
const path = require('path');
const gl = document.querySelector("#c").getContext("webgl", {stencil: true});

function getShader(filename) {
    const absPath = path.join(__dirname, '../shaders/' + filename);
    return fs.readFileSync(absPath, 'utf8');
}

const blurVertexShader = getShader('blur_vertex.vs');
const blurFragmentShader = getShader('blur_fragment.fs');

const fillVertexShader = getShader('fill_vertex.vs');
const fillFragmentShader = getShader('fill_fragment.fs');

const litVertexShader = getShader('lit_vertex.vs');
const litFragmentShader = getShader('lit_fragment.fs');

const simpleVertexShader = getShader('simple_vertex.vs');
const simpleFragmentShader = getShader('simple_fragment.fs');

const blurProgram = twgl.createProgramInfo(gl, [blurVertexShader, blurFragmentShader]);
const fillProgram = twgl.createProgramInfo(gl, [fillVertexShader, fillFragmentShader]);
const litProgram = twgl.createProgramInfo(gl, [litVertexShader, litFragmentShader]);
const simpleProgram = twgl.createProgramInfo(gl, [simpleVertexShader, simpleFragmentShader]);

module.exports.blurProgram = blurProgram;
module.exports.fillProgram = fillProgram;
module.exports.litProgram = litProgram;
module.exports.simpleProgram = simpleProgram;