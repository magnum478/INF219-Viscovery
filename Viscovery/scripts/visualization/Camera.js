class Camera
{
    constructor()
    {
        this.position = vec3.fromValues(0.0, 0.0, 0.0);
        this.viewDirection = vec3.fromValues(0.0, 0.0, -1.0);
        this.up = vec3.fromValues(0.0, 1.0, 0.0);
        this.rotationSpeed = 0.5;
        this.movementSpeed = 0.1;
        this.oldMousePosition = vec2.create();
    }

    getPosition()
    {
        return this.position;
    }

    increasePosition(dX, dY, dZ)
    {
        this.position[0] += dX;
        this.position[1] += dY;
        this.position[2] += dZ;
    }

    mouseUpdate(newMousePosition)
    {
        const mouseDelta = vec2.create();
        vec2.sub(mouseDelta, newMousePosition, this.oldMousePosition);

        if(vec2.length(mouseDelta) > 5.0) {
            this.oldMousePosition = newMousePosition;
            return;
        }
        vec3.rotateY(this.viewDirection, this.viewDirection, this.up, -mouseDelta[0]*this.rotationSpeed);

        const toRotateAround = vec3.create();
        vec3.cross(toRotateAround, this.viewDirection, this.up)
        vec3.rotateX(this.viewDirection, this.viewDirection, toRotateAround, mouseDelta[1]*this.rotationSpeed);

        this.oldMousePosition = newMousePosition;
    }

    getWorldToView()
    {
        const view = mat4.create(),lookAtPoint = vec3.create();
        return mat4.lookAt(view, this.position, vec3.add(lookAtPoint, this.position, this.viewDirection), this.up);
    }

    moveForward()
    {
        const scaledViewDirection = vec3.create();
        vec3.scale(scaledViewDirection, this.viewDirection, this.movementSpeed);
        vec3.add(this.position, this.position, scaledViewDirection);
    }

    moveBackwards()
    {
        const scaledViewDirection = vec3.create();
        vec3.scale(scaledViewDirection, this.viewDirection, -(this.movementSpeed));
        vec3.add(this.position, this.position, scaledViewDirection);
    }

    moveUp()
    {
        const scaledVerticalDirection = vec3.create();
        vec3.scale(scaledVerticalDirection, this.up, this.movementSpeed);
        vec3.add(this.position, this.position, -1*scaledVerticalDirection);
    }

    moveDown()
    {
        const scaledVerticalDirection = vec3.create();
        vec3.scale(scaledVerticalDirection, this.up, -(this.movementSpeed));
        vec3.add(this.position, this.position, -1*scaledVerticalDirection);
    }


    strafeRight()
    {
        const strafeDirection = vec3.create();
        vec3.cross(strafeDirection, this.viewDirection, this.up);
        vec3.scale(strafeDirection, strafeDirection, this.movementSpeed);
        vec3.add(this.position, this.position, strafeDirection);
    }

    strafeLeft()
    {
        const strafeDirection = vec3.create();
        vec3.cross(strafeDirection, this.viewDirection, this.up);
        vec3.scale(strafeDirection, strafeDirection, -(this.movementSpeed));
        vec3.add(this.position, this.position, strafeDirection);
    }
}