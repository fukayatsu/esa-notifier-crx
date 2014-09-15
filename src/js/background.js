var createNotifyOptions = function(notification) {
  var action = ''
  switch(notification.kind) {
    case 'post_create':    action = 'created'; break;
    case 'post_update':    action = 'updated'; break;
    case 'post_star':      action = 'starred'; break;
    case 'comment_create': action = 'commented on'; break;
    case 'comment_star':   action = 'starred the comment on'; break;
    default: action = notification.kind; break;
  }

  return {
    type:   "basic",
    title:  '[esa] ' + notification.activity.user.screen_name,
    message: action + ' ' + notification.post.name,
    iconUrl: notification.activity.user.icon_url
  }
}

var urlForNotify = function(notification) {
  if (notification.activity.comment_id) {
    return notification.url + '#comment-' + notification.activity.comment_id;
  }
  return notification.url;
}

var setActionItem = function(badgeCount) {
  if (badgeCount > 0) {
    chrome.browserAction.setIcon({path: '/img/icon_open_48.png'});
    chrome.browserAction.setBadgeText({ text: badgeCount.toString() });
  } else {
    chrome.browserAction.setIcon({path: '/img/icon_close_48.png'});
    chrome.browserAction.setBadgeText({text: '' });
  }
}

var setStatus = function() {
  $.ajax({
    url: "https://crx.esa.io/api/notifications.json",
    success: function(res) {
      setActionItem(res.data.unread_count);
      if (res.data.unread_count == 0) { return; }
      if (!localStorage.lastUpdatedAt) {
        localStorage.lastUpdatedAt = Date.parse(res.data.notifications[0].updated_at)
        return;
      }

      $(res.data.notifications.reverse()).each(function(){
        var updatedAt = Date.parse(this.updated_at)
        if (updatedAt > localStorage.lastUpdatedAt) {
          chrome.notifications.create(urlForNotify(this), createNotifyOptions(this), function(){});
          localStorage.lastUpdatedAt = updatedAt;
        }
      });
    },
  });
};

$(function() {
  setStatus();
  setInterval(setStatus, 60 * 1000);
});

chrome.notifications.onClicked.addListener(function(url) {
  chrome.tabs.create({ url: url });
});

