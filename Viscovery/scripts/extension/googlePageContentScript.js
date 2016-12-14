var wManager = {}; 
var started = false;
var name = "viscovery";
var targetNode = document.body;
var resultsLoaded = false;
var maxPagesToview = 9;
var canvasDim = 1024;
 
waitForSearchResults();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
      case "image_loaded":
        if(!started) wManager.start();
        wManager.loadImage(request.pageData);
        break;
    }
  });

function onGooglePageLoadComplete() {
  injectCanvas(name);
  wManager = new WindowManager(name);
  var links = getLinks();
  var searchQuery = getTokenizedSearchQuery();
  console.log(links);
  chrome.runtime.sendMessage({
    "message": "google_page_loaded",
    "searchQuery": searchQuery,
    "urls": links
  });
}

function getLinks() {
  var rawLinks = $("h3.r a:not(.l)");
  var numberOfLinks = rawLinks.length;
  var numberOfPagesToView = numberOfLinks > maxPagesToview ? maxPagesToview : numberOfLinks;
  var i = 0;
  var links = [];
  for (i; i<numberOfPagesToView; i++)
  {
    links[i] = rawLinks[i].toString();
  }
  return links;
}

function getTokenizedSearchQuery() {
  var suggestedQuery = $("a.spell").text();
  var query;
  if(suggestedQuery)
  {
    query = suggestedQuery.toLowerCase().split(/\W+/);
  }
  else
  {
    query = $("#lst-ib").val().toLowerCase().split(/\W+/);
  }
  console.log(query);
  return query;
}

function scaleOriginalResultArea() {
  var scale = 0.5;
  var startLeft = $("#rcnt")[0].getBoundingClientRect().right * scale;
  $("#rcnt").css({ "zoom": scale});
  $("#"+name).css({ top: '150px', left: startLeft, position: "absolute" });
}  

function waitForSearchResults()
{
  var observerConfig = {
    childList: true,  
    subtree: true
  };
  
  var observer = new MutationObserver(function(mutations) 
  {
      mutations.forEach(function(mutation) 
      {
          if(mutation.addedNodes)
          {
            if(!resultsLoaded)
            {
              if(mutation.target.querySelector(".srg")) 
              {
                  onGooglePageLoadComplete();
                  resultsLoaded = true;
                  observer.disconnect();
              }
            }
          }
      });    
  });

  observer.observe(targetNode, observerConfig);
}

function injectCanvas(canvasID) 
{
  var canvas = document.createElement("canvas");
  canvas.setAttribute("id", canvasID);
  canvas.width = canvasDim;
  canvas.height = canvasDim;
  document.body.appendChild(canvas);
  scaleOriginalResultArea();
}
