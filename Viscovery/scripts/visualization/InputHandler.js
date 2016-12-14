
class InputHandler
{
    constructor(wManager)
    {
        this.mouseInput = new MouseInputHandler(wManager);
        this.keyboardInput = new KeyboardInputHandler(wManager);
    }
}

class MouseInputHandler
{
    constructor(wManager)
    {
        this.update = true;
        this.wManager = wManager;
        this.windowLayout = wManager.windowLayout;
        this.init();
        this.focused = 
        this.oldMousePosition = 0;
    }

    mouseInWindowBox(posX, posY, window)
    {
        var hitBoxXmin = window.position[0];
        var hitBoxYmin = window.position[1];
        if(window === this.wManager.windowLayout.frontWindow)
        {
            var hitBoxXmax = window.position[0] + window.windowBoxDim*this.wManager.windowLayout.scaleFactor;
            var hitBoxYmax = window.position[1] + window.windowBoxDim*this.wManager.windowLayout.scaleFactor;    
        }
        else
        {
            var hitBoxXmax = window.position[0] + window.windowBoxDim;
            var hitBoxYmax = window.position[1] + window.windowBoxDim;
        }

        if(hitBoxXmin <= posX && posX <= hitBoxXmax && hitBoxYmin <= posY && posY <= hitBoxYmax)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    init()
    {
        var wManager = this.wManager;
        var hexColors = this.wManager.windowLayout.windowColorsHex;
        var timer;
        var delay = 1300;

        $(".rc a").hover( function()
        {
            var link = this.href;

            var focusWindow = wManager.windows.find((window)=>{
                return link == window.pageUrl;
            });
            if(focusWindow)
            {
                wManager.windowLayout.setFocusedWindow(focusWindow);
                timer = setTimeout(function() {
                    wManager.update = true;
                    wManager.windowLayout.resetFocusedWindow();
                    wManager.windowLayout.resetFrontWindow();
                    wManager.windowLayout.setFrontWindow(focusWindow);
                }, delay);
                var hexColor = hexColors[focusWindow.index]
                var result = $(".rc").has('a[href="'+focusWindow.pageUrl+'"]');
                result.css(
                {
                        "zoom": 1.0
                });
                result.css(
                {
                    "border-left-color": hexColor.bg,
                    "padding-left": "0.5cm",
                    "border-left-width": "10px"
                });
                wManager.update = true;
            }
        }, function() {

            var link = this.href;
            var defocusWindow = wManager.windows.find((window)=>{
                return link == window.pageUrl;
            });
            if(defocusWindow)
            {
                wManager.windowLayout.resetFocusedWindow();
                wManager.windowLayout.resetFrontWindow();
                clearTimeout(timer);
                $(".rc").has('a[href="'+defocusWindow.pageUrl+'"]').css(
                    {
                        "zoom": 1.0,
                        "padding-left": "0cm",
                        "border": 'solid 2px white'
                    });
            }
            wManager.update = true;

        });

        $("#"+this.wManager.canvasName).mousemove((e) =>
        {
            var canvas = this.wManager.gl.canvas;
            var left = parseFloat(document.getElementById(this.wManager.canvasName).style.left);
            var top = parseFloat(document.getElementById(this.wManager.canvasName).style.top);
            var focusedWindowInfo = 
            {
                closestDistance: 99999,
                closestWindow: null 
            }
                
            if(!this.wManager.windowLayout.frontWindow)
            {
                this.wManager.windows.forEach((window, index) =>
                {
                    var y = canvas.clientHeight-(e.pageY-top);
                    if(this.mouseInWindowBox((e.pageX-left), y, window))
                    {
                        var currentWindowDistance = window.position[2];
                        if (focusedWindowInfo.closestDistance > currentWindowDistance)
                        {
                            focusedWindowInfo.closestDistance = currentWindowDistance; 
                            focusedWindowInfo.closestWindow = window;   
                        } 
                        
                    }
                    else
                    {
                        window.focused = false;
                        $(".rc").has('a[href="'+window.pageUrl+'"]').css(
                            {
                                "zoom": 1.0,
                                "padding-left": "0cm",
                                "border": 'solid 2px white'
                            });
                    }
                });
                if(focusedWindowInfo.closestWindow)
                {
                    var index = focusedWindowInfo.closestWindow.index;
                    
                    this.wManager.windowLayout.setFocusedWindow(focusedWindowInfo.closestWindow);
                    var hexColor = this.wManager.windowLayout.windowColorsHex[index];
                    var result = $(".rc").has('a[href="'+focusedWindowInfo.closestWindow.pageUrl+'"]');
                    result.css(
                    {
                            "zoom": 1.0
                    });
                    result.css(
                    {
                        "border-left-color": hexColor.bg,
                        "padding-left": "0.5cm",
                        "border-left-width": "10px"
                    });

                }
                else
                {
                    this.wManager.windowLayout.resetFocusedWindow();
                } 
                this.wManager.update = true;
            }
        });

        $("#"+this.wManager.canvasName).click((e) =>
        {
            this.wManager.update = true;
            var focusedWindow = this.wManager.windowLayout.focusedWindow;
            if(focusedWindow)
            {
                focusedWindow.focused = false; 
                if(e.shiftKey)
                {
                    chrome.runtime.sendMessage(
                    {
                        "message": "open_page_url",
                        "pageUrl": focusedWindow.pageUrl
                    });
                }
                else this.wManager.windowLayout.updateFront(focusedWindow);   
            }
        });

    }
}

class KeyboardInputHandler
{
    constructor(wManager)
    {
        this.wManager = wManager;
        this.keyCodes = [];
        this.init();
    }

    init()
    {
        $(document.body).keydown((e) =>
        {
            //$("#example").focus();
            this.keyCodes[e.keyCode] = true;
        });
        $(document.body).keyup((e) =>
        {
            //$("#example").focus();
            this.keyCodes[e.keyCode] = false;
        });
    }

    update()
    {
        const velocity = 0.5;

        if(this.keyCodes[83])
        {
            this.wManager.camera.moveBackwards();
        }

        if(this.keyCodes[87])
        {
            this.wManager.camera.moveForward();
        }

        if(this.keyCodes[37])
        {
            this.wManager.camera.strafeLeft();
        }

        if(this.keyCodes[38])
        {
            this.wManager.camera.moveUp();
        }

        if(this.keyCodes[39])
        {
            this.wManager.camera.strafeRight();
        }

        if(this.keyCodes[40])
        {
            this.wManager.camera.moveDown();
        }
    }
}