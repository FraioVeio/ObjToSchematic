precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texcoord;

//const float kernel[9] = float[](1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0);
const int dilate_size = 15;
const float kernel_weight = float((dilate_size + 1) * (dilate_size + 1));
const vec2 pixel_size = vec2(1.0 / 1920.0, 1.0 / 1080.0); // TODO: FIX

void main() {
  
  vec4 colourSum = vec4(0.0);
  for (int i = -dilate_size; i < dilate_size; ++i)
  {
    for (int j = -dilate_size; j < dilate_size; ++j)
    {
      colourSum = colourSum + texture2D(u_texture, v_texcoord + pixel_size * vec2(i, j));
    }
  }

  gl_FragColor = vec4((colourSum / kernel_weight).rgb, 1.0);

  //gl_FragColor = texture2D(u_texture, v_texcoord);
}
