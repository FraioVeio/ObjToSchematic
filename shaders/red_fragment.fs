precision mediump float;

varying vec3 v_fillColour;

void main() {
  gl_FragColor = vec4(v_fillColour, 1.0);
}
