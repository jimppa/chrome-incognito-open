/**
 * Listens for events this extension registered
 */
chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case 'invert-mode':
      // get the active tab from the active window, and open that tab in
      // an incognito or normal window
      queryTabs({
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT
      }).then(function(tabs) {
        var tab = tabs[0];
        if (tab.url) {
          openInOtherState(tab);
        }
      });
      break;

    default:
      break;
  }
});

/**
 * Opens the tab object in inverted incognito mode
 * @param sourceTab
 */
function openInOtherState(sourceTab) {

  // get all windows
  chrome.windows.getAll(
    { populate: true }, // populate with tabs
    function(windows) {

      // try to reuse a window in other state
      var suitableWindows = windows.filter(function(w) {
        return w.incognito !== sourceTab.incognito;
      });

      // create a new window if necessary and open the tab there
      if (!suitableWindows.length) {

        chrome.windows.create({
          url: sourceTab.url,
          incognito: !sourceTab.incognito
        });

      } else {

        // go through each tab in the suitable windows to see if there already
        // is a page with the desired URL opened
        var tabCandidates = [];
        suitableWindows.forEach(function(w) {

          w.tabs.forEach(function(tabCandidate) {
            if (tabCandidate.url === sourceTab.url) {
              tabCandidates.push(tabCandidate);
            }
          });

        });

        // if there is a match, refresh the tab and focus its window
        if (tabCandidates.length) {

          var _tab = tabCandidates[0];
          chrome.tabs.update(_tab.id, { active: true });
          chrome.tabs.reload(_tab.id, { bypassCache: true });
          chrome.windows.update(_tab.windowId, { focused: true });

        } else {

          // if no suitable tabs, create a new one
          chrome.tabs.create({
            windowId: suitableWindows[0].id,
            url: sourceTab.url,
            active: true
          });

        }

      }

    }
  );
}

/**
 * Returns a promise that will be resolved with the tabs matching criteria.
 * If no tabs are found, the promise is rejected.
 * @param criteria
 * @returns {Promise}
 */
function queryTabs(criteria) {
  return new Promise(function(resolve, reject) {
    chrome.tabs.query(criteria, function(tabs) {
      if (tabs.length > 0) {
        resolve(tabs);
      } else {
        reject();
      }
    });
  });
}

/**
 * Returns the console object of the extensions background-page
 */
function getConsole() {
  return chrome.extension.getBackgroundPage().console;
}
