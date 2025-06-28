// Adapted from:
// <a href="http://callumhay.blogspot.com/2010/09/gaussian-blur-shader-glsl.html" target="_blank" rel="nofollow">http://callumhay.blogspot.com/2010/09/gaussian-blur-shader-glsl.html</a>
 
#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif
 
#define PROCESSING_TEXTURE_SHADER
 
uniform sampler2D texture;
 
// The inverse of the texture dimensions along X and Y
uniform vec2 texOffset;
 
varying vec4 vertColor;
varying vec4 vertTexCoord;
uniform float angle;
uniform int kernelSize;       
uniform float strength;     // The strength value for the gaussian function: higher value means more blur
                            // A good value for 9x9 is around 3 to 5
                            // A good value for 7x7 is around 2.5 to 4
                            // A good value for 5x5 is around 2 to 3.5
                            // ... play around with this based on what you need <span class="Emoticon Emoticon1"><span>:)</span></span>
 
const float pi = 3.14159265;
 
void main() {  
  float numBlurPixelsPerSide = float(kernelSize / 2); 
 
  vec2 blurMultiplyVec = vec2(cos(angle),sin(angle));
  // vec2 blurMultiplyVec2 = vec2(cos(angle+pi*0.5),sin(angle+pi*0.5));
 
  // Incremental Gaussian Coefficent Calculation (See GPU Gems 3 pp. 877 - 889)
  vec3 incrementalGaussian;
  incrementalGaussian.x = 1.0 / (sqrt(2.0 * pi) * strength);
  incrementalGaussian.y = exp(-0.5 / (strength * strength));
  incrementalGaussian.z = incrementalGaussian.y * incrementalGaussian.y;
 
  vec4 avgValue = vec4(0.0, 0.0, 0.0, 0.0);
  float coefficientSum = 0.0;
 
  // Take the central sample first...

  vec4 origValue = texture2D(texture, vertTexCoord.st);
  avgValue += origValue * incrementalGaussian.x;
  coefficientSum += incrementalGaussian.x;
  incrementalGaussian.xy *= incrementalGaussian.yz;
 
  // Go through the remaining 8 vertical samples (4 on each side of the center)
  float weight;
  for (float i = 1.0; i <= numBlurPixelsPerSide; i++) { 
    // Todo: Scale contribution by 1/d^2
    // weight = 1.0/pow(i,2.0);

    avgValue += texture2D(texture, vertTexCoord.st - i * texOffset * 
                          blurMultiplyVec) * incrementalGaussian.x;         
    avgValue += texture2D(texture, vertTexCoord.st + i * texOffset * 
                          blurMultiplyVec) * incrementalGaussian.x;         

    // avgValue += texture2D(texture, vertTexCoord.st - i * texOffset * 
    //                       blurMultiplyVec2) * incrementalGaussian.x;         
    // avgValue += texture2D(texture, vertTexCoord.st + i * texOffset * 
    //                       blurMultiplyVec2) * incrementalGaussian.x;         

    coefficientSum += 2.0 * incrementalGaussian.x;
    incrementalGaussian.xy *= incrementalGaussian.yz;
  }
  gl_FragColor = origValue + (avgValue / coefficientSum);

  // gl_FragColor = max(origValue,(avgValue / coefficientSum));
}