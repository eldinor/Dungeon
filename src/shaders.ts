export default {
    "windVVertexShader": ` 
    precision highp float;

    attribute vec3 position;

    // Uniforms
    uniform mat4 worldViewProjection;
    
    attribute vec2 uv;
    varying vec2 vUV;

    varying vec4 verpos;
    
    void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);
        vUV = uv;
    }`,
    "windVFragmentShader": `
    precision highp float;
    
    varying vec2 vUV;

    uniform sampler2D textureSampler;
    uniform mat4 worldViewProjection;
    uniform float time;
    uniform sampler2D windSampler;
    uniform float windSize;
    uniform float onePx;

    varying vec4 verpos;

    const vec3 midColor = vec3(0.35, 0.4, 0.1);
    const float midPosition = 0.2;

    // SimplexPerlin3D
    const float SKEWFACTOR = 1.0/3.0;
    const float UNSKEWFACTOR = 1.0/6.0;
    const float SIMPLEX_CORNER_POS = 0.5;
    const float SIMPLEX_TETRAHADRON_HEIGHT = 0.70710678118654752440084436210485;
    float SimplexPerlin3D( vec3 P ){
        P.x = P == vec3(0., 0., 0.) ? 0.00001 : P.x;
        P *= SIMPLEX_TETRAHADRON_HEIGHT;
        vec3 Pi = floor( P + dot( P, vec3( SKEWFACTOR) ) );    vec3 x0 = P - Pi + dot(Pi, vec3( UNSKEWFACTOR ) );
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 Pi_1 = min( g.xyz, l.zxy );
        vec3 Pi_2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - Pi_1 + UNSKEWFACTOR;
        vec3 x2 = x0 - Pi_2 + SKEWFACTOR;
        vec3 x3 = x0 - SIMPLEX_CORNER_POS;
        vec4 v1234_x = vec4( x0.x, x1.x, x2.x, x3.x );
        vec4 v1234_y = vec4( x0.y, x1.y, x2.y, x3.y );
        vec4 v1234_z = vec4( x0.z, x1.z, x2.z, x3.z );
        Pi.xyz = Pi.xyz - floor(Pi.xyz * ( 1.0 / 69.0 )) * 69.0;
        vec3 Pi_inc1 = step( Pi, vec3( 69.0 - 1.5 ) ) * ( Pi + 1.0 );
        vec4 Pt = vec4( Pi.xy, Pi_inc1.xy ) + vec2( 50.0, 161.0 ).xyxy;
        Pt *= Pt;
        vec4 V1xy_V2xy = mix( Pt.xyxy, Pt.zwzw, vec4( Pi_1.xy, Pi_2.xy ) );
        Pt = vec4( Pt.x, V1xy_V2xy.xz, Pt.z ) * vec4( Pt.y, V1xy_V2xy.yw, Pt.w );
        const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );
        const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );
        vec3 lowz_mods = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + Pi.zzz * ZINC.xyz ) );
        vec3 highz_mods = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + Pi_inc1.zzz * ZINC.xyz ) );
        Pi_1 = ( Pi_1.z < 0.5 ) ? lowz_mods : highz_mods;
        Pi_2 = ( Pi_2.z < 0.5 ) ? lowz_mods : highz_mods;
        vec4 hash_0 = fract( Pt * vec4( lowz_mods.x, Pi_1.x, Pi_2.x, highz_mods.x ) ) - 0.49999;
        vec4 hash_1 = fract( Pt * vec4( lowz_mods.y, Pi_1.y, Pi_2.y, highz_mods.y ) ) - 0.49999;
        vec4 hash_2 = fract( Pt * vec4( lowz_mods.z, Pi_1.z, Pi_2.z, highz_mods.z ) ) - 0.49999;
        vec4 grad_results = inversesqrt( hash_0 * hash_0 + hash_1 * hash_1 + hash_2 * hash_2 ) * ( hash_0 * v1234_x + hash_1 * v1234_y + hash_2 * v1234_z );
        const float FINAL_NORMALIZATION = 37.837227241611314102871574478976;
        vec4 kernel_weights = v1234_x * v1234_x + v1234_y * v1234_y + v1234_z * v1234_z;
        kernel_weights = max(0.5 - kernel_weights, 0.0);
        kernel_weights = kernel_weights*kernel_weights*kernel_weights;
        return dot( kernel_weights, grad_results ) * FINAL_NORMALIZATION;
    }

    float getWindAt(vec2 pos){
        vec2 texCoord = pos;
        texCoord.x *= 2.0;
        texCoord.x += time*0.3;
        
        // float xRepeat = floor(texCoord.x);
        // //float yRepeat = 0.0;
        // texCoord.x = fract(texCoord.x);
        // texCoord.y = fract(texCoord.y);

        
        // if( mod(xRepeat, 2.0) > 0.0){texCoord.x = 1.0 - texCoord.x;}
        // texCoord.x = texCoord.x*(1.0-onePx*2.0)+onePx;

        // float thisSample = texture2D(windSampler, texCoord).r;
        // //if(texCoord.y > 0.5){
        //     const float blurSize = 2.0;
            
        //     for(float i = -blurSize; i < blurSize; i ++){
        //     float backSampleX = texture2D(windSampler, vec2(onePx*i+texCoord.x, texCoord.y)).r;
        //     thisSample += backSampleX;//4.0;//pow(2.0, abs(i)+3.0);
        //     }
        //     thisSample /= 2.0*blurSize+1.0;
        // //}
        // // else if(texCoord.x > 1.0-onePx){
        //     // float foreSampleX = texture2D(windSampler, vec2(onePx, texCoord.y)).r;
        //     // thisSample = 0.0; mix(thisSample, foreSampleX, 0.5-(1.0-texCoord.x)/onePx*0.5);
        // // }
        return SimplexPerlin3D(vec3(texCoord*0.5, time*0.1));
        //return thisSample;
    }

    void main(void) {
        gl_FragColor = vec4(vec3(getWindAt(vUV)), 1.0);
    }`,
    "grassVertexShader": `  
    precision highp float;
    // Attributes
    attribute vec3 position;
    attribute vec3 normal;
    attribute float height;
    //attribute vec3 location;

    // Uniforms
    uniform mat4 worldViewProjection;
    uniform float time;
    uniform sampler2D windSampler;
    uniform float windSize;
    uniform float onePx;
    uniform mat4 viewProjection;
    uniform float windStrength;

    // Varying
    
    attribute vec2 uv;
    varying vec2 vUV;

    varying vec4 verpos;

    #include<instancesDeclaration>

    // SimplexPerlin3D
    const float SKEWFACTOR = 1.0/3.0;
    const float UNSKEWFACTOR = 1.0/6.0;
    const float SIMPLEX_CORNER_POS = 0.5;
    const float SIMPLEX_TETRAHADRON_HEIGHT = 0.70710678118654752440084436210485;
    float SimplexPerlin3D( vec3 P ){
        P.x = P == vec3(0., 0., 0.) ? 0.00001 : P.x;
        P *= SIMPLEX_TETRAHADRON_HEIGHT;
        vec3 Pi = floor( P + dot( P, vec3( SKEWFACTOR) ) );    vec3 x0 = P - Pi + dot(Pi, vec3( UNSKEWFACTOR ) );
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 Pi_1 = min( g.xyz, l.zxy );
        vec3 Pi_2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - Pi_1 + UNSKEWFACTOR;
        vec3 x2 = x0 - Pi_2 + SKEWFACTOR;
        vec3 x3 = x0 - SIMPLEX_CORNER_POS;
        vec4 v1234_x = vec4( x0.x, x1.x, x2.x, x3.x );
        vec4 v1234_y = vec4( x0.y, x1.y, x2.y, x3.y );
        vec4 v1234_z = vec4( x0.z, x1.z, x2.z, x3.z );
        Pi.xyz = Pi.xyz - floor(Pi.xyz * ( 1.0 / 69.0 )) * 69.0;
        vec3 Pi_inc1 = step( Pi, vec3( 69.0 - 1.5 ) ) * ( Pi + 1.0 );
        vec4 Pt = vec4( Pi.xy, Pi_inc1.xy ) + vec2( 50.0, 161.0 ).xyxy;
        Pt *= Pt;
        vec4 V1xy_V2xy = mix( Pt.xyxy, Pt.zwzw, vec4( Pi_1.xy, Pi_2.xy ) );
        Pt = vec4( Pt.x, V1xy_V2xy.xz, Pt.z ) * vec4( Pt.y, V1xy_V2xy.yw, Pt.w );
        const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );
        const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );
        vec3 lowz_mods = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + Pi.zzz * ZINC.xyz ) );
        vec3 highz_mods = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + Pi_inc1.zzz * ZINC.xyz ) );
        Pi_1 = ( Pi_1.z < 0.5 ) ? lowz_mods : highz_mods;
        Pi_2 = ( Pi_2.z < 0.5 ) ? lowz_mods : highz_mods;
        vec4 hash_0 = fract( Pt * vec4( lowz_mods.x, Pi_1.x, Pi_2.x, highz_mods.x ) ) - 0.49999;
        vec4 hash_1 = fract( Pt * vec4( lowz_mods.y, Pi_1.y, Pi_2.y, highz_mods.y ) ) - 0.49999;
        vec4 hash_2 = fract( Pt * vec4( lowz_mods.z, Pi_1.z, Pi_2.z, highz_mods.z ) ) - 0.49999;
        vec4 grad_results = inversesqrt( hash_0 * hash_0 + hash_1 * hash_1 + hash_2 * hash_2 ) * ( hash_0 * v1234_x + hash_1 * v1234_y + hash_2 * v1234_z );
        const float FINAL_NORMALIZATION = 37.837227241611314102871574478976;
        vec4 kernel_weights = v1234_x * v1234_x + v1234_y * v1234_y + v1234_z * v1234_z;
        kernel_weights = max(0.5 - kernel_weights, 0.0);
        kernel_weights = kernel_weights*kernel_weights*kernel_weights;
        return dot( kernel_weights, grad_results ) * FINAL_NORMALIZATION;
    }

    float getWindAt(vec2 pos){
        vec2 texCoord = pos/windSize;
        texCoord.x *= 2.0;
        texCoord.x += time*0.3;

        // float xRepeat = floor(texCoord.x);
        // texCoord.x = fract(texCoord.x);
        // texCoord.y = fract(texCoord.y);

        
        // if( mod(xRepeat, 2.0) > 0.0){texCoord.x = 1.0 - texCoord.x;}
        // texCoord.x = texCoord.x*(1.0-onePx*2.0)+onePx;

        // float thisSample = texture2D(windSampler, texCoord).r;
        // const float blurSize = 2.0;
        
        // for(float i = -blurSize; i < blurSize; i ++){
        //     float backSampleX = texture2D(windSampler, vec2(onePx*i+texCoord.x, texCoord.y)).r;
        //     thisSample += backSampleX;//4.0;//pow(2.0, abs(i)+3.0);
        // }
        // thisSample /= 2.0*blurSize+1.0;

        // float thisSample = texture2D(windSampler, texCoord).r;
        // if(texCoord.x < onePx){
        //     float backSampleX = texture2D(windSampler, vec2(1.0, texCoord.y)).r;
        //     thisSample = mix(backSampleX, thisSample, 0.5+texCoord.x/onePx*0.5);
        // }
        // else if(texCoord.x > 1.0-onePx){
        //     float foreSampleX = texture2D(windSampler, vec2(onePx, texCoord)).r;
        //     thisSample = mix(thisSample, foreSampleX, 0.5-(1.0-texCoord.x)/onePx*0.5);
        // }
        //return thisSample;
        float mainSample = (SimplexPerlin3D(vec3(texCoord*0.5, time*0.1))+1.0)/2.0;
        float turb = (SimplexPerlin3D(vec3(texCoord*4.0, time*0.2))+1.0)/2.0;
        return mainSample*0.9 + 0.1 *turb;
    }

    void main(void) {
        #include<instancesVertex>

        //gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

        vec4 origin = finalWorld * vec4(0.0, 0.0, 0.0, 1.0);

        vec4 q = vec4(position, 1.0);
        float pctHeight = q.y/height;
        float memory = height*height*0.03;

        q.y *= height;
        float bend = pctHeight*pctHeight;
        q.z += bend;

        q = finalWorld * q;
        q = vec4(q.xyz, 1.0);
        float windAt = getWindAt(origin.xz);
        windAt = windAt*windAt;
        float force = max(min((windAt*windStrength + memory), 8.5), -8.5) * (0.5*(pctHeight * pctHeight)+0.5*pctHeight);
        //vec4 displacement = vec4(-sin(force), (cos(force)-1.0), 0.0, 0.0);
        //vec4 displacement = vec4(-force, -force/2.0, 0.0, 0.0);
        //q += displacement;
        vec4 tLocal = vec4(q.x-origin.x, q.y, q.z-origin.z, 1.0);
        float sf = sin(force);
        float cf = cos(force);
        q.x = tLocal.x*cf - tLocal.y*sf +origin.x;
        q.y = tLocal.x*sf + tLocal.y*cf;
        gl_Position = viewProjection * q;
        verpos = vec4(position, 1.0);
        vUV = uv;
    }`,
    "grassFragmentShader": `
    precision highp float;
    
    varying vec2 vUV;
    uniform sampler2D textureSampler;

    uniform mat4 worldViewProjection;

    varying vec4 verpos;

    const vec3 midColor = vec3(0.35, 0.4, 0.1);
    const float midPosition = 0.3;

    void main(void) {
        gl_FragColor = vec4(1.0);
        
        //vec4 point = worldViewProjection * vec4(gl_PointCoord, 1.0, 1.0);
        vec3 color = vec3(0, 0, 0);
        
        if (verpos.y < midPosition){
            color = mix(vec3(0.07, 0.1, 0.03), midColor, verpos.y/midPosition);
        }else{
            color = mix(midColor, vec3(0.55, 0.75, 0.2), (verpos.y-midPosition)/(1.0-midPosition));
        }
        gl_FragColor = vec4(color, 1.0);
    }`
} as Record<string, string>