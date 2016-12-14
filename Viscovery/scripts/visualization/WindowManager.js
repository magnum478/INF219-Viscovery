class WindowManager
{
    constructor(name)
    {
        this.canvasName = name;
        this.windows = [];
        this.update = false;
        this.canvas = document.getElementById(this.canvasName);
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.aspect = this.canvas.clientWidth/this.canvas.clientHeight;
        this.windowSize = 140.0;
        this.windowBorder = 8.0;
        this.windowContainerDimensions =
        {
            width: 160,
            height: 165,
            padding: 10.0
        };
        this.init();
    }

    init()
    {
        this.gl = initWebGL(this.canvasName);
        if(!this.gl) {
            return;
        }

        this.program = new DifferenceShaderProgram(gl);
        this.boxProgram = new BBoxShaderProgram(gl);
        this.wipProgram = new WindowImportanceMapProgram(gl);
        this.verticalBlurProgram = new GaussianBlurProgram(gl, blurVerticalVertex);
        this.horizontalBlurProgram = new GaussianBlurProgram(gl, blurHorizontalVertex);

        this.boxShadowTexture = loadImageTexture(gl, "http://localhost:8080/images/boxShadow.png");
        this.initWindowBuffers(gl);
        this.camera = new Camera();
        this.mMatrix = mat4.create();
        this.pMatrix = mat4.create();
        
        this.canvasProperties =
        {
            width: this.width,
            height: this.height,
            left: parseFloat(this.canvas.style.left),
            top: parseFloat(this.canvas.style.top)
        };
        this.windowLayout = new WindowLayout(this, "juxta", this.windowContainerDimensions, this.canvasProperties, this.windowBorder);
        this.inputHandler = new InputHandler(this);
    }

    createWindowImportanceMaps(loadedImages)
    {
        this.windows.forEach((window,index) => {
            console.log(loadedImages[index]);
            window.createWindowImportanceMap(this);
        });
    }

    loadImage(pageData)
    {
        if(this.windows.length < 9)
        {
            var imgURL = pageData.imageUrl;
            var pageScore = pageData.tfidfScore;
            var pageTextureUnmarked = loadImageTexture(gl, imgURL+"unmarked.jpeg");
            var pageTextureMarked = loadImageTexture(gl, imgURL+"marked.jpeg");
            this.windows.push(new Window((this.windowSize+this.windowBorder), pageTextureUnmarked, pageTextureMarked, this, pageData.pageIndex, pageData.pageUrl, pageScore));
            this.windowLayout.updateWindows(this.windows);
        }
    }

    initWindows(texturesUnmarked, texturesMarked)
    {
        var numWindows = texturesUnmarked.length;
        for( var i = 0; i < numWindows; i++) {
            this.windows.push(new Window((this.windowSize+this.windowBorder),texturesUnmarked[i], texturesMarked[i], this));
        }
    }

    setMatrixUniforms(shaderProgram)
    {
        var mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, this.camera.getWorldToView(), this.mMatrix);
        mat4.multiply(mvpMatrix, this.pMatrix, mvpMatrix);
        shaderProgram.loadMVPMatrix(mvpMatrix);
    }

    reshape()
    {
        this.width = this.gl.canvas.clientWidth;
        this.height = this.gl.canvas.clientHeight;
        this.aspect = this.gl.canvas.clientWidth/this.gl.canvas.clientHeight;
        if(this.width != this.gl.canvas.width || this.height != this.gl.canvas.height) {
            this.gl.canvas.width = this.width;
            this.gl.canvas.height = this.height;
        }
    
        this.gl.viewport(0, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
    }


    initBlurBoxBuffer(gl)
    {
        this.blurBoxBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.blurBoxBuffer);

        var blurBoxVertices = [
            -1.0,  1.0,
            -1.0, -1.0,
             1.0,  1.0,
             1.0, -1.0,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blurBoxVertices), gl.STATIC_DRAW);

        this.blurBoxBuffer.itemSize = 2;
        this.blurBoxBuffer.numItems = 4;

        gl.enableVertexAttribArray(3); // vertexPositionAttrib
        gl.vertexAttribPointer(3, this.blurBoxBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    initBorderBoxBuffer(gl)
    {
        this.windowBorderCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windowBorderCoordBuffer);
        var size = this.windowSize;
        var border = this.windowBorder;
        var borderVertices = [
             0.0,  0.0, -1.1, // bottom left
             size + border, 0.0, -1.1, // bottom right
             0.0, this.windowContainerDimensions.height, -1.1, // top left
             size + border, this.windowContainerDimensions.height, -1.1  // top right
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(borderVertices), gl.STATIC_DRAW);

        this.windowBorderCoordBuffer.itemSize = 3;
        this.windowBorderCoordBuffer.numItems = 4;

        gl.enableVertexAttribArray(2); // vertexPositionAttrib
        gl.vertexAttribPointer(2, this.windowVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    initWindowBuffers(gl)
    {
        this.windowVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windowVertexPositionBuffer);
        var size = this.windowSize;
        var border = this.windowBorder;
        var vertices = [
             border,  border, -1.0, // bottom left
             size, border, -1.0, // bottom right
             border,  size, -1.0, // top left
             size,  size, -1.0  // top right
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        this.windowVertexPositionBuffer.itemSize = 3;
        this.windowVertexPositionBuffer.numItems = 4;

        gl.enableVertexAttribArray(0); // vertexPositionAttrib
        gl.vertexAttribPointer(0, this.windowVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        this.windowTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windowTextureCoordBuffer);
        var textureCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

        this.windowTextureCoordBuffer.itemSize = 2;
        this.windowTextureCoordBuffer.numItems = 4;

        gl.enableVertexAttribArray(1); // textureCoordAttrib
        gl.vertexAttribPointer(1, this.windowTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.initBorderBoxBuffer(gl);
        this.initBlurBoxBuffer(gl);
    }

    drawWindows()
    {
        this.reshape(gl);
        mat4.ortho(this.pMatrix, 0.0, this.width, 0.0, this.height, 0.0, 40.0);
        if(this.update)
        {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var frontWindow = this.windowLayout.frontWindow;
            if(frontWindow) frontWindow.draw(this);
            else
            {
                if(this.windows.length > 0)
                {

                    this.windows.forEach((window) => {
                        window.draw(this);
                    });
                }
            }
        }
        this.update=false;
    }

    start()
    {
        var canvas = document.getElementById(this.canvasName);

        canvas.addEventListener('webglcontextlost', e =>
        {
            e.preventDefault();
            clearLoadingImages();
            if (requestId !== undefined) {
                window.cancelAnimFrame(requestId);
                this.requestId = undefined;
            }
        }, false);
        canvas.addEventListener('webglcontextrestored', () =>
        {
            this.init();
            animate();
        } , false);

        const animate = () => {
            this.drawWindows();
            this.requestId = window.requestAnimFrame(animate, canvas);
        };
        animate();
    }
}

class Window
{
    constructor(windowDim, textureUnmarked, textureMarked, wManager, index, pageUrl, pageScore)
    {
        this.windowBoxDim = windowDim;
        this.textureUnmarked = textureUnmarked;
        this.textureMarked = textureMarked;
        this.textureBoxShadow = wManager.boxShadowTexture;
        this.position = vec4.create();
        this.index = index;
        this.pageUrl = pageUrl;
        this.score = pageScore;
        this.rotation = vec3.fromValues(0.0, 0.0, 0.0);
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);
        this.angle = degToRad(0);
        this.transformMatrix = mat4.create();
        this.focused = false;
        this.lightColor = vec4.fromValues(0.2, 0.3, 0.6, 1.0);
    }

    getTexture() {
        return this.texture;
    }

    setTexture(texture) {
        this.texture = texture;
    }

    getPosition() {
        return this.position;
    }

    setPosition(position) {
        this.position[0] = position[0];
        this.position[1] = position[1];
    }

    getScale() {
        return this.scale;
    }

    setScale(scale) {
        this.scale = scale;
    }

    translate(dx, dy)
    {
        this.position[0] += dx;
        this.position[1] += dy;
    }

    rotateX(angle)
    {
        this.rotation[0] = 1;
        this.angle = angle;
    }

    computeModelTransformMatrix()
    {
        var transformMatrix = mat4.create();
        mat4.fromTranslation(transformMatrix, this.position);
        mat4.rotate(transformMatrix, transformMatrix, this.angle, this.rotation);
        mat4.scale(transformMatrix, transformMatrix, this.scale);
        this.transformMatrix = transformMatrix;
        return transformMatrix;
    }

    initFBO(gl, width, height)
    {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.fbo = fbo;
        return texture;
    }

    createWindowImportanceMap(wManager)
    {
        var gl = wManager.gl;
        var program = wManager.wipProgram;
        program.start();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureUnmarked);
        program.loadInt(program.location_textureUnmarked, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textureMarked);
        program.loadInt(program.location_textureMarked, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, wManager.windowVertexPositionBuffer.numItems);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        program.stop();
    }

    blurHorizontal(wManager, pageTexture)
    {
        var program = wManager.horizontalBlurProgram;
        var gl = wManager.gl;
        var width = gl.drawingBufferWidth,
            height = gl.drawingBufferHeight;
        var framebuffer = createFramebuffer(wManager.gl, {width: width, height: height});

        //gl.clearColor(0.0, 0.0, 0.0, 0.0);
        //gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.fbo);
        program.start();
        program.loadTargetDimension(width);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pageTexture);
        program.loadInt(program.location_texture, 0);
        gl.enableVertexAttribArray(3);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.blurBoxBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, wManager.blurBoxBuffer.numItems);
        gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);
        program.stop();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return framebuffer.texture;
    }

    drawBoxShadow(wManager)
    {
        var shadowOffset = {
            x:2,
            y:-3,
            z:-2
        };
        var program = wManager.program;
        var gl = wManager.gl;
        program.start();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureBoxShadow);
        var transformMatrix = mat4.create();
        mat4.fromTranslation(transformMatrix, vec4.fromValues(this.position[0]+shadowOffset.x, this.position[1]+shadowOffset.y, this.position[2]+shadowOffset.z, this.position[3]));
        mat4.scale(transformMatrix, transformMatrix, this.scale);
        wManager.mMatrix = transformMatrix;
        program.loadInt(wManager.program.location_texture, 0);
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.windowTextureCoordBuffer);
        wManager.setMatrixUniforms(program);
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.windowBorderCoordBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, wManager.windowBorderCoordBuffer.numItems);
        program.stop();
    }

    draw(wManager)
    {
        var gl = wManager.gl;
        gl.depthFunc(gl.LESS);
        gl.enable(gl.DEPTH_TEST);
        wManager.mMatrix = this.computeModelTransformMatrix();
      
        var program = wManager.program;
        program.start();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureUnmarked);
        program.loadInt(wManager.program.location_texture, 0);
        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.windowTextureCoordBuffer);
        wManager.setMatrixUniforms(program);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.windowVertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, wManager.windowVertexPositionBuffer.numItems);
        program.stop();
        var boxProgram = wManager.boxProgram;
        if(this.focused)
        {
            boxProgram.start();
            boxProgram.loadBoolean(boxProgram.location_focused, true);
            boxProgram.loadVec4(boxProgram.location_backgroundColor, this.lightColor);
        }
        else
        {
            this.drawBoxShadow(wManager);
            boxProgram.start();
            boxProgram.loadBoolean(boxProgram.location_focused, false);
        }
        wManager.setMatrixUniforms(boxProgram);
        gl.enableVertexAttribArray(2);
        gl.bindBuffer(gl.ARRAY_BUFFER, wManager.windowBorderCoordBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, wManager.windowBorderCoordBuffer.numItems);
        boxProgram.stop();
    }
}

class WindowBarChart
{
    constructor(position, canvasPosition, windowContainerDimensions, index)
    {
        this.id = "chart"+index;
        this.barChartDiv = this.injectBarChartDiv(position, canvasPosition, windowContainerDimensions);
        this.hide();
    }

    injectBarChartDiv(position, canvasPosition, windowContainerDimensions, index)
    {
        var chartDiv = document.createElement("div");
        var offset = {
            x:8,
            y:5
        };
        chartDiv.className = "barChart";
        chartDiv.id = this.id;
        document.body.appendChild(chartDiv);
        chartDiv.style.left = (canvasPosition.left + position.x) + offset.x + "px";
        var offsettedInvertedOrigin = canvasPosition.top + canvasPosition.height;
        chartDiv.style.top = (offsettedInvertedOrigin - windowContainerDimensions.height + offset.y - position.y) + "px";
        return chartDiv;
    }

    show()
    {
        this.barChartDiv.style.visibility = "visible";
    }

    hide()
    {
        this.barChartDiv.style.visibility = "hidden";
    }

    populateWithTFIDFScore(tfidfScore, hexColor)
    {
        var score = tfidfScore.score;
        var maxScore = tfidfScore.maxScore;
        var bg = hexColor.bg;
        var text = hexColor.text;
        var x = d3.scaleLinear()
        .domain([0, maxScore])
        .range([0, 125]);
        if(score <= 0){
            this.barChartDiv.style.boxShadow = "none";
            bg = "none";
            text = "black";
        }
        d3.select("#"+this.id)
            .data([Math.round(score)])
            .style("background-color", bg)
            .style("color", text)
            .style("width",
                function(d)
                {
                    return x(d) + "px";
                })
            .text(function(d) { return Math.floor((d/maxScore)*100) + "%"; });
        this.show();
    }
}

class WindowLayout
{
    constructor(wManager, mode, containerSize, canvasProperties, border)
    {
        this.wManager = wManager;
        this.windows = wManager.windows;
        this.containerPositions = [];
        this.focusedWindowContainer =
        {
            position: vec3.fromValues(20.0, 440, -0.1),
            scale: vec3.fromValues(4.0, 4.0, 1.0),
            focused: false,
        }
        this.focusedWindow = null;
        this.frontWindow = null;
        var alpha = 1.0;
        this.windowColorsHex =
        [
            {bg: "#8c510a", text: "black"},
            {bg: "#bf812d", text: "black"},
            {bg: "#dfc27d", text: "black"},
            {bg: "#f6e8c3", text: "black"},
            {bg: "#f5f5f5", text: "black"},
            {bg: "#c7eae5", text: "black"},
            {bg: "#80cdc1", text: "black"},
            {bg: "#35978f", text: "white"},
            {bg: "#01665e", text: "white"},
        ];

        this.windowColorsRGBA =
        [
            vec4.fromValues(140/255,81/255,10/255,alpha),
            vec4.fromValues(191/255,129/255,45/255,alpha),
            vec4.fromValues(223/255,194/255,125/255,alpha),
            vec4.fromValues(246/255,232/255,195/255,alpha),
            vec4.fromValues(245/255,245/255,245/255,alpha),
            vec4.fromValues(199/255,234/255,229/255, alpha),
            vec4.fromValues(128/255,205/255,193/255,alpha),
            vec4.fromValues(53/255,151/255,143/255,alpha),
            vec4.fromValues(1/255,102/255,94/255,alpha)
        ];
        switch (mode) {
            case "juxta":
                var containerPosWithBarcharts = this.initJuxtaPositionGrid(3, 3, containerSize, canvasProperties);
                this.startPositions = containerPosWithBarcharts.startPositions;
                this.barCharts = containerPosWithBarcharts.barCharts;
                break;

            default:
            this.startPositions =
            [
                    vec4.fromValues(0.0, 4.0, 0.0, 1.0),
                    vec4.fromValues(2.0, 4.0, 0.0, 1.0),
                    vec4.fromValues(4.0, 4.0, 0.0, 1.0),
                    vec4.fromValues(0.0, 2.0, 0.0, 1.0),
                    vec4.fromValues(2.0, 2.0, 0.0, 1.0),
                    vec4.fromValues(4.0, 2.0, 0.0, 1.0),
                    vec4.fromValues(0.0, 0.0, 0.0, 1.0),
                    vec4.fromValues(2.0, 0.0, 0.0, 1.0),
                    vec4.fromValues(4.0, 0.0, 0.0, 1.0),
            ]
                break;
        }
        this.init();
    }

    init()
    {
        this.windows.forEach((window) => {
            if(this.frontWindow) this.hideBarCharts();
            if(window !== this.frontWindow)
            {
                window.position = this.startPositions[window.index];
                window.lightColor = this.windowColorsRGBA[window.index];
                this.barCharts[window.index].populateWithTFIDFScore(window.score, this.windowColorsHex[window.index]);
            }
        });
        this.wManager.update = true;
    }

    initJuxtaPositionGrid(gridPositionsX, gridPositionsY, containerSize, canvasProperties)
    {
        if(gridPositionsY <= 1 || gridPositionsX <= 1)
        {
            console.log("failed to init juxtaPositionGrid: grid parameters not set to valid values (<= 1)");
            return;
        }
        var padding = 130;
        var yOffset = 10;
        var startPositions = [];
        var barCharts = [];
        var i = 0;
        var z = -1.0;
        var windowPositionTopLeftY = canvasProperties.height-containerSize.height;
        var y = 0;
        for(y; y<gridPositionsY; y++)
        {
            var x = 0;
            for(x; x < gridPositionsX; x++)
            {
                var currentWindowPos = {
                    x: x * containerSize.width + padding,
                    y: windowPositionTopLeftY - (y * (containerSize.height+yOffset))
                }
                startPositions[i] = vec4.fromValues(currentWindowPos.x, currentWindowPos.y, z, 1);
                barCharts[i] = new WindowBarChart(currentWindowPos, canvasProperties, containerSize, i);
                i++;
            }
        }
        return {
            startPositions: startPositions,
            barCharts: barCharts
        };
    }

    updateFront(window)
    {

        if(this.frontWindow)
        {
            if(this.frontWindow === window) this.resetFrontWindow();
            else {
                this.resetFrontWindow();
                this.setFrontWindow(window);
            }
        }
        else
        {
            this.setFrontWindow(window);
        }
    }

    setFocusedWindow(window)
    {
        if(window)
        {
            this.focusedWindow = window;
            window.focused = true;
        }
    }

    resetFocusedWindow()
    {
        if(this.focusedWindow)
        {
            this.focusedWindow.focused = false;
            this.focusedWindow = null;    
        }
    }

    setFrontWindow(window)
    {
        if(window)
        {
            this.hideBarCharts();
            window.position = this.focusedWindowContainer.position;
            window.scale = this.focusedWindowContainer.scale;
            window.front = true;
            this.frontWindow = window;
            this.focusedWindowContainer.focused = true;
            this.focusedWindow = window;
        }
    }

    resetFrontWindow()
    {
        if(this.frontWindow)
        {
            this.showBarCharts();
            this.frontWindow.scale = vec3.fromValues(1.0, 1.0, 1.0);
            this.frontWindow.front = false;
            this.focusedWindowContainer.focused = false;
            this.frontWindow = null;
            this.focusedWindow = null;
            this.init();
        }
    }

    showBarCharts()
    {
        this.barCharts.forEach(barChart => barChart.show());
    }

    hideBarCharts()
    {
        this.barCharts.forEach(barChart => barChart.hide());
    }


    setWindowPositions()
    {
        this.windows.forEach((window, index) =>
        {
            window.lightColor = this.windowColorsRGBA[index];
            window.position = this.containerPositions[index];
        });
    }
    updateWindows(windows)
    {
        this.windows = windows;
        this.init();
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/* ================= Unused classes and functions =============================

function createFramebuffer(gl, size)
{
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    var texture = createTexture(gl, size);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return {
        texture: texture,
        fbo: fbo
    };
}

function createTexture(gl, size)
{
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
}

const DEPTH_BUFFER_TYPE =
{
    NONE: 0,
    DEPTH_RENDER_BUFFER: 1,
    DEPTH_TEXTURE: 2
};

class FBO
{
    constructor(gl, width, height, depthBuffer)
    {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.initialiseFramebuffer(gl, depthBuffer);
    }

    bindFramebuffer(gl)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.viewport(0, 0, this.width, this.height);
    }

    getFrameBufferTexture()
    {
        return this.colorTexture;
    }

    unbindFramebuffer()
    {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }

    cleanUp()
    {
        this.gl.deleteFramebuffer(this.fbo);
        this.gl.deleteRenderbuffer(this.depthBuffer);
        this.gl.deleteTexture(this.colorTexture);
        this.gl.deleteTexture(this.depthTexture);
    }

    createFramebuffer(gl)
    {
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        return fbo;
    }

    createTextureAttachment(gl)
    {
        var colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        return colorTexture;
    }

    createDepthTextureAttachment()
    {
        this.depthTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT16, this.width, this.height, 0, this.gl.DEPTH_COMPONENT,
                this.gl.FLOAT, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture, 0);
    }

    createDepthBufferAttachment()
    {
        this.depthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.width, this.height);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthBuffer);
    }

    initialiseFramebuffer(gl, type)
    {
        this.fbo = this.createFramebuffer(gl);
        this.colorTexture = this.createTextureAttachment(gl);
        if (type == DEPTH_BUFFER_TYPE.DEPTH_RENDER_BUFFER) {
            this.createDepthBufferAttachment();
        } else if (type == DEPTH_BUFFER_TYPE.DEPTH_TEXTURE) {
            this.createDepthTextureAttachment();
        }
        this.unbindFramebuffer();
    }
}



class ImageRenderer
{
    constructor(gl, width, height)
    {
        this.gl = gl;
        this.fboWidth = width;
        this.fboHeight = height;
        this.quadVBO = this.createQuad(gl);
        //this.fbo = new FBO(gl, width, height, DEPTH_BUFFER_TYPE.NONE);
    }

    createQuad(gl)
    {
        var quadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);

        var vertices =
        [
           -1.0,  1.0,
           -1.0, -1.0,
            1.0,  1.0,
            1.0, -1.0,
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return quadVBO;
    }

    bindFramebuffer(gl, fbo)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0,0, this.fboWidth, this.fboHeight);
    }

    unbindFramebuffer(gl)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    renderQuad(gl, shader, texture, fbo)
    {
        //gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.disable(gl.DEPTH_TEST);
        //gl.clear(gl.COLOR_BUFFER_BIT);
        shader.start();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        shader.loadInt(shader.location_texture, 0);
        this.bindFramebuffer(gl, fbo);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.unbindFramebuffer(gl);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.enable(gl.DEPTH_TEST);
        shader.stop();
    }

     start(gl)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.enableVertexAttribArray(0);
        gl.disable(gl.DEPTH_TEST);
    }

    end(gl)
    {
        gl.enable(gl.DEPTH_TEST);
        gl.disableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

const BLUR_ORIENTATIONS =
{
    HORIZONTAL:  0,
    VERTICAL: 1
};

class Blur
{
    constructor(gl, fboWidth, fboHeight, blurOrientation)
    {
        this.gl = gl;
        if(blurOrientation == BLUR_ORIENTATIONS.HORIZONTAL)
        {
            this.shader = new GaussianBlurProgram(gl, blurHorizontalVertex);
            this.shader.start();
            this.shader.loadTargetDimension(fboWidth);
        }
        else
        {
            this.shader = new GaussianBlurProgram(gl, blurVerticalVertex);
            this.shader.start();
            this.shader.loadTargetDimension(fboHeight);
        }
        this.shader.stop();

        this.fbo = gl.createFramebuffer();
        this.colorTexture = this.createTextureAttachment(gl, fboWidth, fboHeight, this.fbo);
    }

    render(texture, renderer){
        renderer.renderQuad(this.gl, this.shader, texture, this.fbo);
    }

    createTextureAttachment(gl, width, height, fbo)
    {
        var colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        return colorTexture;
    }

    cleanUp()
    {
        this.renderer.cleanUp();
        this.shader.cleanUp();
        this.gl.deleteFramebuffer(this.fbo);
        this.gl.deleteTexture(this.colorTexture);
    }

    getOutputTexture()
    {
        return this.colorTexture;
    }
}

class PreProcessing
{
    constructor(gl)
    {
        this.gl = gl;
        this.renderer = new ImageRenderer(gl, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.horizontalBlur = new Blur(gl, gl.drawingBufferWidth, gl.drawingBufferHeight, BLUR_ORIENTATIONS.HORIZONTAL);
        this.verticalBlur = new Blur(gl, gl.drawingBufferWidth, gl.drawingBufferHeight, BLUR_ORIENTATIONS.VERTICAL);
    }

    blur(texture)
    {
        this.horizontalBlur.render(texture, this.renderer);
        this.verticalBlur.render(this.horizontalBlur.getOutputTexture(), this.renderer);
        return this.horizontalBlur.getOutputTexture();
    }

    cleanUp()
    {
        this.horizontalBlur.cleanUp();
        this.verticalBlur.cleanUp();
    }
}

*/
