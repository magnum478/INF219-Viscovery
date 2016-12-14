class MousePicker 
{
    constructor(camera, projectionMatrix, aabbMin, aabbMax)
    {
        this.currentRay = vec3.create();
        this.tMin = 0.0;
        this.tMax = 10.0;
        this.aabbMin = vec3.fromValues( 0, 0, -1.0);
        this.aabbMax = vec3.fromValues( 180.0,  180.0, -1.0);
        this.projectionMatrix = projectionMatrix;
        this.camera = camera;
        this.viewMatrix = camera.getWorldToView();
    }

    getCurrentRay()
    {
        return this.currentRay;
    }

    update(mouseX, mouseY, width, height)
    {
        this.viewMatrix = this.camera.getWorldToView();
        const normalizedCoords = this.getNormalizedDeviceCoords(mouseX, mouseY, width, height);
        this.currentRay = this.calculateMouseRay(normalizedCoords);
    }

    calculateMouseRay(normalizedCoords)
    {
        const clipCoords = vec4.fromValues(normalizedCoords.x, normalizedCoords.y, -1.0, 1.0); 
        const eyeCoords = this.toEyeCoords(clipCoords);
        const worldRay = this.toWorldCoords(eyeCoords);
        return worldRay;     
    }
    

    toWorldCoords(eyeCoords)
    {
        const invertedView = mat4.create();
        mat4.invert(invertedView, this.viewMatrix);
        const rayWorld = vec4.create(); 
        vec4.transformMat4(rayWorld, eyeCoords, invertedView);
        const mouseRay = vec3.fromValues(rayWorld[0], rayWorld[1], rayWorld[2]);
        vec3.normalize(mouseRay, mouseRay);
        return mouseRay;
    }

    toEyeCoords(clipCoords)
    {
        const invertedProjection = mat4.invert(this.projectionMatrix, this.projectionMatrix);
        const eyeCoords = vec4.create(); 
        vec4.transformMat4(eyeCoords, clipCoords, invertedProjection);
        return vec4.fromValues(eyeCoords[0], eyeCoords[1], -1.0, 0.0);
    }

    getNormalizedDeviceCoords(mouseX, mouseY, width, height)
    {
        return {
            x: (2.0*mouseX)/width - 1.0,
            y: 1.0 - (2.0*mouseY)/height
        };
    }

    testRayOBBIntersection(mMatrix, isFocused)
    {
        this.tMin = 0.0;
        this.tMax = 100.0;
        if(isFocused) 
        {
            this.aabbMin = vec3.fromValues( -8.8, -9, -0.9);
            this.aabbMax = vec3.fromValues( 6, 5.2, -0.9);
        }
        else
        {
            this.aabbMin = vec3.fromValues( 0, 0, -1.0);
            this.aabbMax = vec3.fromValues( 180.0,  180.0, -1.0);
        }
        const OBBpositionWorldSpace = vec3.fromValues(mMatrix[12], mMatrix[13], mMatrix[14]);
        const delta = vec3.create();
        vec3.subtract(delta, OBBpositionWorldSpace, this.camera.getPosition());
        var testXAxis = this.testAxisIntersection([mMatrix[0], mMatrix[1], mMatrix[2]], 0, delta); 
        var testYAxis = this.testAxisIntersection([mMatrix[4], mMatrix[5], mMatrix[6]], 1, delta); 
        var testZAxis = this.testAxisIntersection([mMatrix[8], mMatrix[9], mMatrix[10]], 2, delta);
        if(!testXAxis || !testYAxis || !testZAxis){
            return {intersected: false};    
        }
        else
        {
            return {
                    intersected: true,    
                    intersectionDistance: this.tMin
            };
        }
    }

    testAxisIntersection(axis, coordIndex, delta)
    {
        var e = vec3.dot(axis, delta);
        var f = vec3.dot(this.currentRay, axis);

        if(Math.abs(f) > 0.001) 
        {
            var t1 = (e+this.aabbMin[coordIndex])/f;
            var t2 = (e+this.aabbMax[coordIndex])/f;

            if(t1>t2)
            {
                var w=t1;
                t1=t2;
                t2=w;
            }

            if(t2<this.tMax) this.tMax = t2;
            if(t1>this.tMin) this.tMin = t1;
            if(this.tMax < this.tMin) return false;
        }
        else
        {
            if(-e+this.aabbMin[coordIndex] > 0.0 || -e+this.aabbMax[coordIndex] < 0.0) return false;
        }
        return true; 
    }
}