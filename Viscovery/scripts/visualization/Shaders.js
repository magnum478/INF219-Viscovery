const blurVerticalVertex = `
        attribute vec2 a_position;

        uniform float targetDimension;

        varying vec2 textureCoords[11];

        void main()
        {
            gl_Position = vec4(a_position, 0.0, 1.0);
            vec2 centerCoord = a_position * 0.5 + 0.5;
            float pixelSize = 1.0 / targetDimension;

            for(int i = -5; i<=5; i++)
            {
                textureCoords[i+5] = centerCoord + vec2(0.0, pixelSize * float(i));
            }
        }`;

const blurHorizontalVertex = `
        attribute vec2 a_position;

        uniform float targetDimension;

        varying vec2 textureCoords[11];

        void main()
        {
            gl_Position = vec4(a_position, 0.0, 1.0);
            vec2 centerCoord = a_position * 0.5 + 0.5;
            float pixelSize = 1.0 / targetDimension;

            for(int i = -5; i<=5; i++)
            {
                textureCoords[i+5] = centerCoord + vec2(pixelSize * float(i), 0.0);
            }
        }`;

const blurFragmentSrc = `
        precision mediump float;
        varying vec2 textureCoords[11];

        uniform sampler2D textureSampler;

        void main()
        {
           gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
           gl_FragColor += texture2D(textureSampler, textureCoords[0]) * 0.0093;
           gl_FragColor += texture2D(textureSampler, textureCoords[1]) * 0.028002;
           gl_FragColor += texture2D(textureSampler, textureCoords[2]) * 0.065984;
           gl_FragColor += texture2D(textureSampler, textureCoords[3]) * 0.121703;
           gl_FragColor += texture2D(textureSampler, textureCoords[4]) * 0.175713;
           gl_FragColor += texture2D(textureSampler, textureCoords[5]) * 0.198596;
           gl_FragColor += texture2D(textureSampler, textureCoords[6]) * 0.175713;
           gl_FragColor += texture2D(textureSampler, textureCoords[7]) * 0.121703;
           gl_FragColor += texture2D(textureSampler, textureCoords[8]) * 0.065984;
           gl_FragColor += texture2D(textureSampler, textureCoords[9]) * 0.028002;
           gl_FragColor += texture2D(textureSampler, textureCoords[10]) * 0.0093;
           gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }`;


const boxVertexSource = `
        uniform mat4 u_mvpMatrix;

        attribute vec3 a_vertexPosition;
        //attribute vec4 a_vertexColor;

        //varying lowp vec4 vColor;

        void main()
        {
            gl_Position = u_mvpMatrix * vec4(a_vertexPosition, 1.0);
         //   vColor = a_vertexColor;
        }`;

const boxFragmentSource = `
      precision mediump float;

      uniform bool u_focused;
      uniform vec4 u_bgColor;

      //varying lowp vec4 vColor;

      void main()
      {
            if(u_focused)
            {
                gl_FragColor = u_bgColor;
            }
            else
            {
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
      }`;

const differenceVertexSource = `
        uniform mat4 u_mvpMatrix;

        attribute vec2 a_texCoord;
        attribute vec3 a_vertexPosition;


        varying vec2 v_texCoord;
        varying vec3 position;

        void main()
        {
            gl_Position = u_mvpMatrix * vec4(a_vertexPosition, 1.0);
            v_texCoord = a_texCoord;
            position = a_vertexPosition;
        }`;

const differenceFragmentSource = `
      precision mediump float;
      uniform sampler2D u_sampler2d;
      uniform bool u_focused;
      uniform bool wandMode;

      uniform vec2 lightPos;
      uniform vec4 lightColor;

      varying vec2 v_texCoord;
      varying vec3 position;

      void main()
      {
          if(wandMode)
          {
                float intensity = 1.0 / length(position.xy - lightPos) * 0.1;
                if(u_focused)
                {
                    gl_FragColor = lightColor * texture2D(u_sampler2d, v_texCoord) * intensity;
                }
                else
                {
                    gl_FragColor = texture2D(u_sampler2d, v_texCoord) * intensity;
                }
          }
          else
          {
              if(u_focused)
              {
                    gl_FragColor = lightColor * texture2D(u_sampler2d, v_texCoord);
              }
              else
              {
                    gl_FragColor = texture2D(u_sampler2d, v_texCoord);
              }
          }
      }`;

const windowImportanceMapVertexSource = `
        uniform mat4 u_mvpMatrix;

        attribute vec2 a_texCoord;
        attribute vec3 a_vertexPosition;


        varying vec2 v_texCoord;

        void main()
        {
            gl_Position = vec4(a_vertexPosition, 1.0);
            v_texCoord = a_texCoord;
        }`;

const windowImportanceMapFragmentSource = `
      precision mediump float;
      uniform sampler2D u_textureUnmarked;
      uniform sampler2D u_textureMarked;

      varying vec2 v_texCoord;

      void main()
      {
          vec4 colorDifference = texture2D(u_textureUnmarked, v_texCoord) - texture2D(u_textureMarked, v_texCoord);
          if(colorDifference.rgb == vec3(0.0, 0.0, 0.0))
          {
             gl_FragColor = vec4(texture2D(u_textureMarked, v_texCoord).rgb, 0.7);
             //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
             //gl_FragColor = texture2D(u_textureMarked, v_texCoord);
          }
          else
          {
             gl_FragColor = vec4(texture2D(u_textureMarked, v_texCoord).rgb, 1.0);
             //gl_FragColor = vec4(0.5, 0.2, 0.7, 1.0);
             //gl_FragColor = texture2D(u_textureMarked, v_texCoord);
          }
      }`;

class ShaderProgram
{
    constructor(gl, vertexSrc, fragmentSrc)
    {
        this.gl = gl;
        this.location_mvpMatrix = mat4.create();
        this.vertexShaderID = this.loadShader(gl, vertexSrc, gl.VERTEX_SHADER);
        this.fragmentShaderID = this.loadShader(gl, fragmentSrc, gl.FRAGMENT_SHADER);
        this.programID = gl.createProgram();
        gl.attachShader(this.programID, this.vertexShaderID);
        gl.attachShader(this.programID, this.fragmentShaderID);
        this.bindAttributes();
        gl.linkProgram(this.programID);
        gl.validateProgram(this.programID);
        var linked = gl.getProgramParameter(this.programID, gl.LINK_STATUS);
        if (!linked && !gl.isContextLost()) {
            // something went wrong with the link
            var error = gl.getProgramInfoLog (this.programID);
            log("Error in program linking:"+error);

            gl.deleteProgram(this.programID);
            gl.deleteProgram(this.fragmentShaderID);
            gl.deleteProgram(this.vertexShaderID);

            return null;
        }
    }

    loadMat4(location, theMat4)
    {
        this.gl.uniformMatrix4fv(location, false, theMat4);
    }

    loadBoolean(location, value)
    {
        var toLoad = value ? 1 : 0;
        this.gl.uniform1f(location, toLoad);
    }

    loadVec2(location, theVec2)
    {
        this.gl.uniform2f(location, theVec2[0], theVec2[1]);
    }

    loadVec3(location, theVec3)
    {
        this.gl.uniform3f(location, theVec3[0], theVec3[1], theVec3[2]);
    }

    loadVec4(location, theVec4)
    {
        this.gl.uniform4f(location, theVec4[0], theVec4[1], theVec4[2], theVec4[3]);
    }

    loadFloat(location, value)
    {
        this.gl.uniform1f(location, value);
    }

    loadInt(location, value)
    {
        this.gl.uniform1i(location, value);
    }

    getUniformLocation(uniformName)
    {
        return this.gl.getUniformLocation(this.programID, uniformName);
    }

    start()
    {
        this.gl.useProgram(this.programID);
    }

    stop()
    {
        this.gl.useProgram(null);
    }

    cleanUp()
    {
        this.stop();
        var gl = this.gl;
        gl.detachShader(this.programID, this.vertexShaderID);
        gl.detachShader(this.programID, this.fragmentShaderID);
        gl.deleteShader(this.vertexShaderID);
        gl.deleteShader(this.fragmentShaderID);
        gl.deleteProgram(this.programID);
    }

    bindAttribute(attribute, name)
    {
        this.gl.bindAttribLocation(this.programID, attribute, name);
    }


    loadShader(gl, shaderSrc, shaderType)
    {
        if (!shaderSrc) {
            log("*** Error: shader not found");
            return null;
        }

        // Create the shader object
        var shader = gl.createShader(shaderType);

        // Load the shader source
        gl.shaderSource(shader, shaderSrc);
        // Compile the shader
        gl.compileShader(shader);
        // Check the compile status
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled && !gl.isContextLost()) {
            // Something went wrong during compilation; get the error
            const error = gl.getShaderInfoLog(shader);
            log("*** Error compiling shader '"+shader+":"+error);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }


}

class GaussianBlurProgram extends ShaderProgram
{
    constructor(gl, blurVertexSrc)
    {
        super(gl, blurVertexSrc, blurFragmentSrc);
        this.getAllUniformLocations();
    }
    bindAttributes()
    {
        super.bindAttribute(3, "a_position");
    }
    getAllUniformLocations()
    {
        this.location_texture = super.getUniformLocation("textureSampler");
        this.location_targetDimension = super.getUniformLocation("targetDimension");
    }

    loadTargetDimension(dimension)
    {
        super.loadFloat(this.location_targetDimension, dimension);
    }
}


class WindowImportanceMapProgram extends ShaderProgram
{
    constructor(gl)
    {
        super(gl, windowImportanceMapVertexSource, windowImportanceMapFragmentSource);
        this.getAllUniformLocations();
    }
    bindAttributes()
    {
        super.bindAttribute(0, "a_vertexPosition");
        super.bindAttribute(1, "a_texCoord");
    }
    getAllUniformLocations()
    {
        this.location_mvpMatrix = super.getUniformLocation("u_mvpMatrix");
        this.location_textureUnmarked = super.getUniformLocation("u_textureUnmarked");
        this.location_textureMarked = super.getUniformLocation("u_textureMarked");
        //this.location_focused = super.getUniformLocation("u_focused");
    }

    loadMVPMatrix(mvpMatrix)
    {
        super.loadMat4(this.location_mvpMatrix, mvpMatrix);
    }
}

class DifferenceShaderProgram extends ShaderProgram
{
    constructor(gl)
    {
        super(gl, differenceVertexSource, differenceFragmentSource);
        this.getAllUniformLocations();
    }
    bindAttributes()
    {
        super.bindAttribute(0, "a_vertexPosition");
        super.bindAttribute(1, "a_texCoord");
    }

    getAllUniformLocations()
    {
        this.location_mvpMatrix = super.getUniformLocation("u_mvpMatrix");
        this.location_texture = super.getUniformLocation("u_sampler2d");
        this.location_focused = super.getUniformLocation("u_focused");
        this.location_wandMode = super.getUniformLocation("wandMode");
        this.location_lightColor = super.getUniformLocation("lightColor");
        this.location_lightPos = super.getUniformLocation("lightPos");
    }

    loadMVPMatrix(mvpMatrix)
    {
        super.loadMat4(this.location_mvpMatrix, mvpMatrix);
    }
}


class BBoxShaderProgram extends ShaderProgram
{
    constructor(gl)
    {
        super(gl, boxVertexSource, boxFragmentSource);
        this.getAllUniformLocations();
    }
    bindAttributes()
    {
        super.bindAttribute(2, "a_vertexPosition");
    }
    getAllUniformLocations()
    {
        this.location_mvpMatrix = super.getUniformLocation("u_mvpMatrix");
        this.location_backgroundColor = super.getUniformLocation("u_bgColor");
        this.location_focused = super.getUniformLocation("u_focused");
    }

    loadMVPMatrix(mvpMatrix)
    {
        super.loadMat4(this.location_mvpMatrix, mvpMatrix);
    }
}