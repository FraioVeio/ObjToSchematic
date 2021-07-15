precision mediump float;

varying vec3 v_fillColour;
uniform bool u_fill;

void main() {
  if (u_fill)
  {
    gl_FragColor = vec4(v_fillColour, 1.0);
  }
  else
  {
    float colour = mod(gl_FragCoord.x + gl_FragCoord.y, 10.0) / 10.0;
    gl_FragColor = vec4(vec3(colour), 1.0);
  }  
}
