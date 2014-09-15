window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  if (event.data.name == 'clickLink') {
    chrome.tabs.create({ url: event.data.url });
  }
}
chrome.browserAction.setBadgeText({text: '' });
