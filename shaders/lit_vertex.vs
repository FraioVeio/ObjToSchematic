uniform vec3 u_lightWorldPos;
uniform mat4 u_worldViewProjection;

attribute vec4 position;
attribute vec3 normal;

varying vec4 v_colour;

void main() {
  vec3 v_lightDir = normalize(u_lightWorldPos);
  float lighting = abs(dot(normal, v_lightDir));
  
  lighting = (clamp(lighting, 0.0, 1.0) * 0.66) + 0.33;

  //vec3 normal_ = (normal + 1.0) / 2.0;
  //v_colour = vec4(normal_ * lighting, 1.0);
  v_colour = vec4(vec3(lighting), 1.0);

  gl_Position = u_worldViewProjection * vec4(position.xyz, 1.0);
}