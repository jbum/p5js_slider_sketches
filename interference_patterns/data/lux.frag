#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif

uniform sampler2D uTexture;
uniform vec2 uTexOffset;
uniform float uAngle;
uniform int uKernelSize;
uniform float uStrength;

varying vec4 vertColor;
varying vec4 vertTexCoord;

const float pi = 3.14159265;

void main() {  
  float numBlurPixelsPerSide = float(uKernelSize / 2); 

  vec2 blurMultiplyVec = vec2(cos(uAngle), sin(uAngle));

  // Incremental Gaussian Coefficient Calculation
  vec3 incrementalGaussian;
  incrementalGaussian.x = 1.0 / (sqrt(2.0 * pi) * uStrength);
  incrementalGaussian.y = exp(-0.5 / (uStrength * uStrength));
  incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;

  vec4 avgValue = vec4(0.0, 0.0, 0.0, 0.0);
  float coefficientSum = 0.0;

  // Take the central sample first...
  vec4 origValue = texture2D(uTexture, vertTexCoord.st);
  avgValue += origValue * incrementalGaussian.x;
  coefficientSum += incrementalGaussian.x;
  incrementalGaussian.xy *= incrementalGaussian.yz;

  // Go through the remaining samples
  for (float i = 1.0; i <= numBlurPixelsPerSide; i++) { 
    avgValue += texture2D(uTexture, vertTexCoord.st - i * uTexOffset * 
                          blurMultiplyVec) * incrementalGaussian.x;         
    avgValue += texture2D(uTexture, vertTexCoord.st + i * uTexOffset * 
                          blurMultiplyVec) * incrementalGaussian.x;         

    coefficientSum += 2.0 * incrementalGaussian.x;
    incrementalGaussian.xy *= incrementalGaussian.yz;
  }
  
  gl_FragColor = origValue + (avgValue / coefficientSum);
} 