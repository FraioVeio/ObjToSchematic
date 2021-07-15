const twgl = require('twgl.js');
const fs = require('fs');
const path = require('path');
const gl = document.querySelector("#c").getContext("webgl");

function getShader(filename) {
    const absPath = path.join(__dirname, '../shaders/' + filename);
    return fs.readFileSync(absPath, 'utf8');
}

const shadedVertexShader = getShader('shaded_vertex.vs');
const shadedFragmentShader = getShader('shaded_fragment.fs');

const redVertexShader = getShader('red_vertex.vs');
const redFragmentShader = getShader('red_fragment.fs');

/*
const shaded_vertex_shader = fs.readFileSync('./shaders/shaded_vertex.vs', 'utf8');
const shaded_fragment_shader = fs.readFileSync('./shaders/shaded_fragment.fs', 'utf8');

const debug_vertex_shader = fs.readFileSync('./shaders/debug_vertex.vs', 'utf8');
const debug_fragment_shader = fs.readFileSync('./shaders/debug_fragment.fs', 'utf8');
*/

const shadedProgram = twgl.createProgramInfo(gl, [shadedVertexShader, shadedFragmentShader]);
const redProgram = twgl.createProgramInfo(gl, [redVertexShader, redFragmentShader]);

module.exports.shadedProgram = shadedProgram;
module.exports.redProgram = redProgram;
