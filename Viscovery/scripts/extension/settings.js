$("#btnScreenshot").click( function() {
  var numPages = $("#selectionNumPages").val();
  chrome.runtime.sendMessage({ "message": "number_of_pages_to_view_set", "numPages": numPages});
});

$('#isMarkedSelected').click(function() {
    chrome.runtime.sendMessage({ "message": "mark_checkBox_clicked", "isChecked": this.checked});
});
