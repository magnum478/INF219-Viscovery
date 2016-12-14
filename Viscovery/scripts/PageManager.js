class PageManager {
  constructor(googlePage, links) {
    this.googlePage = googlePage;
    this.links = links;
    this.socket = this.initSocketConnection();
  }

  initSocketConnection()
  {
    var socket = io.connect('http://localhost:3000');
    socket.emit("google_result_links", {"resultPageURLs": this.links, "searchQuery": this.googlePage.searchQuery});
    socket.on("image_loaded", (data) => {
      console.log(data);
      this.onFinishedLoadingImage(this.googlePage, data);  
    });
    return socket;
  }

  onFinishedLoadingImage(googlePage, data) {
    var pageData = 
    {
      imageUrl: data.ImgUrl,
      pageIndex: data.pageIndex,
      tfidfScore: data.tfidfScore,
      pageUrl: this.links[data.pageIndex]
    }
    chrome.tabs.sendMessage(googlePage.tabID, {
        "message" : "image_loaded",
        pageData
    });
  }
}

class GooglePage {
  constructor(tabID, searchQuery, resultPageLinks) {
    this.tabID = tabID;
    this.searchQuery = searchQuery;
    this.resultPageLinks = resultPageLinks;
  }
}
