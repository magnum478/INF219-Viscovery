//alert("fuck yeah");
chrome.runtime.sendMessage({"message": "result_page_loaded"});
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
      case "find_search_query_term":
        findSearchQuery(request.searchQuery);
        var viewportDimensions = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        setTimeout(function(){
          chrome.runtime.sendMessage({"message": "ready_for_snapshot", "viewportDimensions": viewportDimensions});
        }, 200);

        break;
    }
  });

  function findSearchQuery(searchQuery) {
    window.find(searchQuery[0]);
  }
