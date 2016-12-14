"use strict";

var page = require('webpage').create();
var args = require('system').args;


var url = args[1];
var imagePath = args[2];
var searchQuery = args[3];
//var scrollToText = args[4];
var scrollTop = 0,
    scrollLeft = 0;
var width = 1024;
var height = 1024;
var zoom = 0.5;

//page.zoomFactor = zoom;

//page.settings.userAgent = "Mozilla/5.0 (Linux; <Android Version>; <Build Tag etc.>) AppleWebKit/<WebKit Rev> (KHTML, like Gecko) Chrome/<Chrome Rev> Mobile Safari/<WebKit Rev>";

page.viewportSize = { width: width, height: height/4 };

page.clipRect = { top: 50, left: 0, width: width, height: height };

page.open(url, function (status) {
    if(status === "success")
    {

/*
        if(page.injectJs("jquery-3.1.1.min.js")) {
            var offset = page.evaluate((function(text) {
                    
                    $("body:contains('"+text+"')").last().html(function(_, html) {
                        return html.replace(text, '<span class="scrollToAnchor">$1</span>');
                    });
                    
                    return $('.scrollToAnchor').html();           
            }), scrollToText);
            console.log(offset);
            //scrollTop = offset.top;
            //scrollLeft = offset.left;
            //page.scrollPosition = {
            //    top: scrollTop,
            //    left: scrollLeft
            //};
        }
         */
        page.render(imagePath+"unmarked.jpeg", {format: "jpeg", quality: "100"});
        if(page.injectJs("mark.min.js")) {
            page.evaluate((function(query, text) {
                var regEx = new RegExp("("+query+")[^].*\.|"+query, "gmi");
                var instance = new Mark(document.querySelector("body"));
                instance.markRegExp(regEx);
            }), searchQuery);
            page.render(imagePath+"marked.jpeg", {format: "jpeg", quality: "100"});
        }   
    }
    //page.render(imagePath);
    phantom.exit();
    //var base64 = page.renderBase64('PNG');
    //console.log(base64);
});

function chainInjectJs(page, jsFiles) {
    if (jsFiles.length === 0) {
        return true;
    }

    var file = jsFiles.shift();
    
    if(page.injectJs(file)) 
    {
        chainInjectJs(page, jsFiles);
    }
    else return false; 
        
}

/*
page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js", function() {

    var foo = page.evaluate(function() {
        return $("#foo").text;
    });
  
});



   
        includeJSLibs(["https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js", "https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.4.0/mark.min.js"], page, () => 
        {
            page.evaluate((function(query, text) {
                var regEx = new RegExp("("+query+")[^].*\.|"+query, "gmi");
                var instance = new Mark(document.querySelector("body"));
                instance.markRegExp(regEx);
            }), searchQuery);
            page.render(imagePath+"marked.jpeg", {format: "jpeg", quality: "100"});
        });
        

function findByText(rootElement, text){
    var filter = {
        acceptNode: function(node){
            // look for nodes that are text_nodes and include the following string.
            if(node.nodeType === document.TEXT_NODE && node.nodeValue.includes(text)){
                 return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
        }
    }
    var nodes = [];
    var walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, filter, false);
    while(walker.nextNode()){
       //give me the element containing the node
       nodes.push(walker.currentNode.parentNode);
    }
    return nodes;
}


 //call it like
                var nodes = findByText(document.body, scrollToText);
                //then do what you will with nodes[];
                var scrollTop = 0;
                var scrollLeft = 0;
                for(var i = 0; i < nodes.length; i++){ 
                    scrollTop = nodes[i].offsetTop;
                    scrollLeft = nodes[i].offsetLeft;
                } 
                page.scrollPosition = {
                    top:    scrollTop,
                    left:   scrollLeft
                }


function includeJSLibs(libraryURLS, pageObject, callback)
{ 
    libraryURLS.reduce((sequence, libURL) => {
    // Fetch chapter
        return sequence.then(() => {
            return includeJS(libURL, pageObject);
        });
    }, Promise.resolve()).then(()=>{ callback();});
}

function includeJS(url) {
  // Return a new promise.
    return new Promise(function(resolve, reject) {
        page.includeJs("https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js", function() { resolve(); });
    });
}

   if(page.injectJs("mark.min.js")) {
            page.evaluate((function(query, text) {
                var regEx = new RegExp("("+query+")[^].*\.|"+query, "gmi");
                var instance = new Mark(document.querySelector("body"));
                instance.markRegExp(regEx);
            }), searchQuery);
            page.render(imagePath+"marked.jpeg", {format: "jpeg", quality: "100"});
        }   
*/

