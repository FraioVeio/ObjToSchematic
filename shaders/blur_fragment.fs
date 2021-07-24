precision mediump float;

uniform sampler2D u_texture;
uniform float time;

varying vec2 v_texcoord;

const int dilate_size = 4;
const float kernel_weight = float((dilate_size + 1) * (dilate_size + 1));
const vec2 pixel_size = vec2(1.0 / 1920.0, 1.0 / 1080.0); // TODO: FIX

//const float highlight_width = 10.0;

void main() {
  
  vec4 colourSum = vec4(0.0);
  for (int i = -dilate_size; i < dilate_size; ++i)
  {
    for (int j = -dilate_size; j < dilate_size; ++j)
    {
      colourSum = colourSum + texture2D(u_texture, v_texcoord + pixel_size * vec2(i, j));
    }
  }

  vec4 colour = colourSum / kernel_weight;
  //colour.a = colour.a * float(mod(gl_FragCoord.x - gl_FragCoord.y + time, highlight_width * 2.0) > highlight_width);
  gl_FragColor = colour;
}
