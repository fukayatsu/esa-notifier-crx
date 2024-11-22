const ALERM_NAME = "check_notifications";
const ALERM_PERIOD_IN_MINUTES = 5;

const createNotifyOptions = function(notification) {
  let action = '';
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

const urlForNotify = function(notification) {
  if (notification.activity.comment_id) {
    return notification.url + '#comment-' + notification.activity.comment_id;
  }
  return notification.url;
}

const setActionItem = function(badgeCount) {
  if (badgeCount > 0) {
    chrome.action.setIcon({path: '/img/icon_open_48.png'});
    chrome.action.setBadgeText({ text: badgeCount.toString() });
  } else {
    chrome.action.setIcon({path: '/img/icon_close_48.png'});
    chrome.action.setBadgeText({text: '' });
  }
}

const setStatus = async function() {
  const res = await fetch("https://crx.esa.io/api/notifications.json");
  const json = await res.json();

  const data = json.data;
  setActionItem(data.unread_count);
  if (data.unread_count == 0) { return; }
  const savedLastUpdatedAt = (await chrome.storage.local.get('lastUpdatedAt')).lastUpdatedAt;
  if (!savedLastUpdatedAt) {
    await chrome.storage.local.set({ lastUpdatedAt: Date.parse(data.notifications[0].updated_at) })
    return;
  }

  data.notifications.reverse().forEach(async function(notification) {
    const updatedAt = Date.parse(notification.updated_at)
    const savedLastUpdatedAt = (await chrome.storage.local.get('lastUpdatedAt')).lastUpdatedAt;

    if (updatedAt > savedLastUpdatedAt) {
      chrome.notifications.create(urlForNotify(notification), createNotifyOptions(notification), function(){});
      await chrome.storage.local.set({lastUpdatedAt: updatedAt});
    }
  });
};

chrome.notifications.onClicked.addListener(function(url) {
  chrome.tabs.create({ url: url });
});

async function setUpOffscreen() {
  await chrome.offscreen.createDocument({
    url: browser.runtime.getURL('view/offscreen.html'),
    reasons: ['BLOBS'],
    justification: 'Check notification updates',
  });
}

async function ensureAlarm() {
  const alarm = await chrome.alarms.get(ALERM_NAME);

  if (!alarm) {
    await chrome.alarms.create({ periodInMinutes: ALERM_PERIOD_IN_MINUTES });
  }
}
ensureAlarm();

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name == ALERM_NAME) {
    setStatus();
  }
});
