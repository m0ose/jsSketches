export const reorganizedFragmentShader = `#version 300 es
precision lowp float;
precision lowp int;
precision lowp sampler2D;
precision lowp sampler2DArray;

const int LOOP_MAX = 1000;

ivec3 uOutputDim = ivec3(1, 1, 1);
ivec2 uTexSize = ivec2(1, 1);

in vec2 vTexCoord;

float atan2(float v1, float v2) {
  if (v1 == 0.0 || v2 == 0.0) return 0.0;
  return atan(v1 / v2);
}

float cbrt(float x) {
  if (x >= 0.0) {
    return pow(x, 1.0 / 3.0);
  } else {
    return -pow(x, 1.0 / 3.0);
  }
}

float expm1(float x) {
  return pow(2.718281828459045, x) - 1.0; 
}

float fround(highp float x) {
  return x;
}

float imul(float v1, float v2) {
  return float(int(v1) * int(v2));
}

float log10(float x) {
  return log2(x) * (1.0 / log2(10.0));
}

float log1p(float x) {
  return log(1.0 + x);
}

float _pow(float v1, float v2) {
  if (v2 == 0.0) return 1.0;
  return pow(v1, v2);
}

float _round(float x) {
  return floor(x + 0.5);
}


const int BIT_COUNT = 32;
int modi(int x, int y) {
  return x - y * (x / y);
}

int bitwiseOr(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) || (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseXOR(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) != (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseAnd(int a, int b) {
  int result = 0;
  int n = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 && b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseNot(int a) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if (modi(a, 2) == 0) {
      result += n;    
    }
    a = a / 2;
    n = n * 2;
  }
  return result;
}
int bitwiseZeroFillLeftShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n *= 2;
  }

  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

int bitwiseSignedRightShift(int num, int shifts) {
  return int(floor(float(num) / pow(2.0, float(shifts))));
}

int bitwiseZeroFillRightShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n /= 2;
  }
  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

vec2 integerMod(vec2 x, float y) {
  vec2 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec3 integerMod(vec3 x, float y) {
  vec3 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec4 integerMod(vec4 x, vec4 y) {
  vec4 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

float integerMod(float x, float y) {
  float res = floor(mod(x, y));
  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);
}

int integerMod(int x, int y) {
  return x - (y * int(x/y));
}

float divWithIntCheck(float x, float y) {
  if (floor(x) == x && floor(y) == y && integerMod(x, y) == 0.0) {
    return float(int(x) / int(y));
  }
  return x / y;
}

float integerCorrectionModulo(float number, float divisor) {
  if (number < 0.0) {
    number = abs(number);
    if (divisor < 0.0) {
      divisor = abs(divisor);
    }
    return -(number - (divisor * floor(divWithIntCheck(number, divisor))));
  }
  if (divisor < 0.0) {
    divisor = abs(divisor);
  }
  return number - (divisor * floor(divWithIntCheck(number, divisor)));
}
// Here be dragons!
// DO NOT OPTIMIZE THIS CODE
// YOU WILL BREAK SOMETHING ON SOMEBODY'S MACHINE
// LEAVE IT AS IT IS, LEST YOU WASTE YOUR OWN TIME
const vec2 MAGIC_VEC = vec2(1.0, -256.0);
const vec4 SCALE_FACTOR = vec4(1.0, 256.0, 65536.0, 0.0);
const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536
float decode32(vec4 texel) {
  texel *= 255.0;
  vec2 gte128;
  gte128.x = texel.b >= 128.0 ? 1.0 : 0.0;
  gte128.y = texel.a >= 128.0 ? 1.0 : 0.0;
  float exponent = 2.0 * texel.a - 127.0 + dot(gte128, MAGIC_VEC);
  float res = exp2(round(exponent));
  texel.b = texel.b - 128.0 * gte128.x;
  res = dot(texel, SCALE_FACTOR) * exp2(round(exponent-23.0)) + res;
  res *= gte128.y * -2.0 + 1.0;
  return res;
}

float decode16(vec4 texel, int index) {
  int channel = integerMod(index, 2);
  return texel[channel*2] * 255.0 + texel[channel*2 + 1] * 65280.0;
}

float decode8(vec4 texel, int index) {
  int channel = integerMod(index, 4);
  return texel[channel] * 255.0;
}

vec4 legacyEncode32(float f) {
  float F = abs(f);
  float sign = f < 0.0 ? 1.0 : 0.0;
  float exponent = floor(log2(F));
  float mantissa = (exp2(-exponent) * F);
  // exponent += floor(log2(mantissa));
  vec4 texel = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;
  texel.rg = integerMod(texel.rg, 256.0);
  texel.b = integerMod(texel.b, 128.0);
  texel.a = exponent*0.5 + 63.5;
  texel.ba += vec2(integerMod(exponent+127.0, 2.0), sign) * 128.0;
  texel = floor(texel);
  texel *= 0.003921569; // 1/255
  return texel;
}

// https://github.com/gpujs/gpu.js/wiki/Encoder-details
vec4 encode32(float value) {
  if (value == 0.0) return vec4(0, 0, 0, 0);

  float exponent;
  float mantissa;
  vec4  result;
  float sgn;

  sgn = step(0.0, -value);
  value = abs(value);

  exponent = floor(log2(value));

  mantissa = value*pow(2.0, -exponent)-1.0;
  exponent = exponent+127.0;
  result   = vec4(0,0,0,0);

  result.a = floor(exponent/2.0);
  exponent = exponent - result.a*2.0;
  result.a = result.a + 128.0*sgn;

  result.b = floor(mantissa * 128.0);
  mantissa = mantissa - result.b / 128.0;
  result.b = result.b + exponent*128.0;

  result.g = floor(mantissa*32768.0);
  mantissa = mantissa - result.g/32768.0;

  result.r = floor(mantissa*8388608.0);
  return result/255.0;
}
// Dragons end here

int index;
ivec3 threadId;

ivec3 indexTo3D(int idx, ivec3 texDim) {
  int z = int(idx / (texDim.x * texDim.y));
  idx -= z * int(texDim.x * texDim.y);
  int y = int(idx / texDim.x);
  int x = int(integerMod(idx, texDim.x));
  return ivec3(x, y, z);
}

float get32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return decode32(texel);
}

float get16(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 2;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 2, texSize.y));
  return decode16(texel, index);
}

float get8(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 4;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 4, texSize.y));
  return decode8(texel, index);
}

float getMemoryOptimized32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int channel = integerMod(index, 4);
  index = index / 4;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  index = index / 4;
  vec4 texel = texture(tex, st / vec2(texSize));
  return texel[channel];
}

vec4 getImage2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, st / vec2(texSize));
}

vec4 getImage3D(sampler2DArray tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, vec3(st / vec2(texSize), z));
}

float getFloatFromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return result[0];
}

vec2 getVec2FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec2(result[0], result[1]);
}

vec2 getMemoryOptimizedVec2(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  index = index / 2;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  if (channel == 0) return vec2(texel.r, texel.g);
  if (channel == 1) return vec2(texel.b, texel.a);
  return vec2(0.0, 0.0);
}

vec3 getVec3FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec3(result[0], result[1], result[2]);
}

vec3 getMemoryOptimizedVec3(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int fieldIndex = 3 * (x + texDim.x * (y + texDim.y * z));
  int vectorIndex = fieldIndex / 4;
  int vectorOffset = fieldIndex - vectorIndex * 4;
  int readY = vectorIndex / texSize.x;
  int readX = vectorIndex - readY * texSize.x;
  vec4 tex1 = texture(tex, (vec2(readX, readY) + 0.5) / vec2(texSize));

  if (vectorOffset == 0) {
    return tex1.xyz;
  } else if (vectorOffset == 1) {
    return tex1.yzw;
  } else {
    readX++;
    if (readX >= texSize.x) {
      readX = 0;
      readY++;
    }
    vec4 tex2 = texture(tex, vec2(readX, readY) / vec2(texSize));
    if (vectorOffset == 2) {
      return vec3(tex1.z, tex1.w, tex2.x);
    } else {
      return vec3(tex1.w, tex2.x, tex2.y);
    }
  }
}

vec4 getVec4FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  return getImage2D(tex, texSize, texDim, z, y, x);
}

vec4 getMemoryOptimizedVec4(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return vec4(texel.r, texel.g, texel.b, texel.a);
}

vec4 actualColor;
void color(float r, float g, float b, float a) {
  actualColor = vec4(r,g,b,a);
}

void color(float r, float g, float b) {
  color(r,g,b,1.0);
}

float modulo(float number, float divisor) {
  if (number < 0.0) {
    number = abs(number);
    if (divisor < 0.0) {
      divisor = abs(divisor);
    }
    return -mod(number, divisor);
  }
  if (divisor < 0.0) {
    divisor = abs(divisor);
  }
  return mod(number, divisor);
}

uniform float user_a;
uniform float user_b;
vec2 kernelResult;
out vec4 data0;
float deg2rad(float user_d) {
return (((user_d/360.0)*2.0)*3.141592653589793);
}
float mag(vec3 user_v) {
return sqrt(((pow(user_v[0],2.0)+pow(user_v[1],2.0))+pow(user_v[2],2.0)));
}
float dot(vec3 user_v1, vec3 user_v2) {
return (((user_v1[0]*user_v2[0])+(user_v1[1]*user_v2[1]))+(user_v1[2]*user_v2[2]));
}
vec3 scale(float user_s, vec3 user_v) {
return vec3((user_s*user_v[0]), (user_s*user_v[1]), (user_s*user_v[2]));
}
vec3 subVectors(vec3 user_v1, vec3 user_v2) {
return vec3((user_v1[0]-user_v2[0]), (user_v1[1]-user_v2[1]), (user_v1[2]-user_v2[2]));
}
vec3 addVectors(vec3 user_v1, vec3 user_v2) {
return vec3((user_v1[0]+user_v2[0]), (user_v1[1]+user_v2[1]), (user_v1[2]+user_v2[2]));
}
vec3 normalize(vec3 user_v) {
return scale((1.0/mag(user_v)), user_v);
}
vec2 threeD2AziAlt(vec3 user_p) {
vec3 user_n=vec3(0.0, 0.0, 1.0);
vec3 user_a=vec3(0.0, 1.0, 0.0);
vec3 user_proj=subVectors(user_p, scale(dot(user_p, user_n), user_n));
float user_nrmMag=mag(user_proj);
if ((user_nrmMag==0.0)){
return vec2(0.0, (sign(user_p[2])*deg2rad(90.0)));}

vec3 user_nrm=scale((1.0/user_nrmMag), user_proj);
float user_dotpAzi=dot(user_nrm, user_a);
float user_dotpAlt=dot(user_nrm, user_p);
float user_angleAzi=acos(user_dotpAzi);
float user_angleAlt=acos(user_dotpAlt);
if ((user_p[0]<0.0)){
user_angleAzi=-user_angleAzi;}

if ((user_p[2]<0.0)){
user_angleAlt=-user_angleAlt;}

return vec2(user_angleAzi, user_angleAlt);
}


vec3 pointRotate3D(vec3 user_p1, vec3 user_p2, vec3 user_p0, float user_theta) {
vec3 user_p=subVectors(user_p0, user_p1);
vec3 user_N=subVectors(user_p2, user_p1);
vec3 user_n=normalize(user_N);
float user_c=cos(user_theta);
float user_t=(1.0-cos(user_theta));
float user_s=sin(user_theta);
float user_X=user_n[0],user_Y=user_n[1],user_Z=user_n[2];
float user_d11=(((user_t*user_X)*user_X)+user_c);
float user_d12=(((user_t*user_X)*user_Y)-(user_s*user_Z));
float user_d13=(((user_t*user_X)*user_Z)+(user_s*user_Y));
float user_d21=(((user_t*user_X)*user_Y)+(user_s*user_Z));
float user_d22=(((user_t*user_Y)*user_Y)+user_c);
float user_d23=(((user_t*user_Y)*user_Z)-(user_s*user_X));
float user_d31=(((user_t*user_X)*user_Z)-(user_s*user_Y));
float user_d32=(((user_t*user_Y)*user_Z)+(user_s*user_X));
float user_d33=(((user_t*user_Z)*user_Z)+user_c);
vec3 user_q=vec3(0.0, 0.0, 0.0);
user_q[0]=(((user_d11*user_p[0])+(user_d12*user_p[1]))+(user_d13*user_p[2]));
user_q[1]=(((user_d21*user_p[0])+(user_d22*user_p[1]))+(user_d23*user_p[2]));
user_q[2]=(((user_d31*user_p[0])+(user_d32*user_p[1]))+(user_d33*user_p[2]));
vec3 user_result=addVectors(user_q, user_p1);
return user_result;
}
vec3 aziAlt2ThreeD(float user_azi, float user_alt) {
vec3 user_v0=vec3(0.0, 1.0, 0.0);
vec3 user_v1=pointRotate3D(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), user_v0, user_alt);
vec3 user_v2=pointRotate3D(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), user_v1, (-1.0*user_azi));
return user_v2;
}
vec3 cantUp(float user_cantAzi, float user_cantAlt) {
return aziAlt2ThreeD(user_cantAzi, (deg2rad(90.0)+user_cantAlt));
}

vec3 rotCantUp(vec3 user_xyz, float user_cantAzi, float user_cantAlt, float user_cantOff) {
return pointRotate3D(vec3(0.0, 0.0, 0.0), cantUp(user_cantAzi, user_cantAlt), user_xyz, user_cantOff);
}
vec3 cantTan(float user_cantAzi) {
return aziAlt2ThreeD((user_cantAzi+deg2rad(90.0)), 0.0);
}
vec3 rotCantTan(vec3 user_xyz, float user_cantAzi, float user_cantAlt) {
return pointRotate3D(vec3(0.0, 0.0, 0.0), cantTan(user_cantAzi), user_xyz, user_cantAlt);
}
vec3 aziRot(vec3 user_xyz, float user_azi) {
return pointRotate3D(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), user_xyz, user_azi);
}
vec3 altRot(vec3 user_xyz, float user_alt) {
return pointRotate3D(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), user_xyz, user_alt);
}

vec2 cantAziAlt(float user_azi, float user_alt, float user_camAz, float user_camAlt, float user_cantAz, float user_cantAlt, float user_cantOff) {
vec3 user_v0=aziAlt2ThreeD(user_azi, user_alt);
vec3 user_v1=altRot(user_v0, user_camAlt);
vec3 user_v2=aziRot(user_v1, -user_camAz);
vec3 user_v3=rotCantTan(user_v2, user_cantAz, user_cantAlt);
vec3 user_v4=rotCantUp(user_v3, user_cantAz, user_cantAlt, user_cantOff);
return threeD2AziAlt(user_v4);
}
void kernel() {

vec2 user_fu=cantAziAlt(0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0);
kernelResult = user_fu;return;
}
void main(void) {
  index = int(vTexCoord.s * float(uTexSize.x)) + int(vTexCoord.t * float(uTexSize.y)) * uTexSize.x;
  threadId = indexTo3D(index, uOutputDim);
  kernel();
  data0[0] = kernelResult[0];
  data0[1] = kernelResult[1];

}`