$("#btnScreenshot").click( function() {
  var numPages = $("#selectionNumPages").val();
  chrome.runtime.sendMessage({ "message": "number_of_pages_to_view_set", "numPages": numPages});
});
