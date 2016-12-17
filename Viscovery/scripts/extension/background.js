var pageManager;
var googleTabID;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.message) {
      case "open_page_url":
        chrome.tabs.create({url:request.pageUrl}, ()=> {console.log("opened new tab!")});
        chrome.tabs.update(googleTabID, {selected: true});
        break;
        
      case "number_of_pages_to_view_set":
      // Send a message to the active tab (googleTab)
        pageManager.setPagesToView(parseInt(request.numPages));
        pageManager.nextResultPage();
        break;
        
       case "mark_checkBox_clicked":
        chrome.tabs.sendMessage(googleTabID, {
        "message" : "mark_checkBox_clicked", 
        "isChecked": request.isChecked
        });
        break
        
      case "google_page_loaded":
        googleTabID = sender.tab.id;
        pageManager = new PageManager(new GooglePage(sender.tab.id, request.searchQuery), request.urls);
        break;
    }
});
