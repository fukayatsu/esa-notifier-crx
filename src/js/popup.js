window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
  if (event.data.name == 'clickLink') {
    chrome.tabs.create({ url: event.data.url });
  }
}
chrome.browserAction.setIcon({path: '/img/icon_close_48.png'});
chrome.browserAction.setBadgeText({text: '' });
