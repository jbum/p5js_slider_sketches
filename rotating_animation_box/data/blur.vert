#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aVertexColor;

varying vec4 vertColor;
varying vec4 vertTexCoord;

void main() {
  vertColor = aVertexColor;
  vertTexCoord = vec4(aTexCoord, 0.0, 1.0);
  gl_Position = vec4(aPosition, 1.0);
} 