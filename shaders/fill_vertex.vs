uniform mat4 u_worldViewProjection;
uniform vec3 u_fillColour;

attribute vec3 position;

varying vec3 v_fillColour;

void main() {
  v_fillColour = u_fillColour;
  gl_Position = u_worldViewProjection * vec4(position, 1.0);
}
