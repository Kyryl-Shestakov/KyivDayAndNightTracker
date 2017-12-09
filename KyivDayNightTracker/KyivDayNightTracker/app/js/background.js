// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
          // That fires when page URL corresponds to 
          // http://kyivdennoch.novy.tv/ua/ or https://kyivdennoch.novy.tv/ua/ or
          // http://kyivdennoch.novy.tv/ua/episodes/ or https://kyivdennoch.novy.tv/ua/episodes/
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { 
				hostEquals: "kyivdennoch.novy.tv",
				pathEquals: "/ua/",
				schemes: ["http", "https"]
			}
          }),
		  new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { 
				hostEquals: "kyivdennoch.novy.tv",
				pathEquals: "/ua/episodes/",
				schemes: ["http", "https"]
			}
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});

var backgroundApi = (function () {
    function handleIndexOverflow(message) {
        var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];
        popupWindow.popupApi.handleError();

        alert(message);

        chrome.storage.local.get(
            "episodeLinkOffsetIndex",
            function (indexContainer) {
                var index = indexContainer.episodeLinkOffsetIndex;
                chrome.storage.local.set(
                    {
                        "episodeLinkOffsetIndex": index - 1
                    }
                );
            }
        );
    }

    function handleNegativeEpisodeIndex(message) {
        var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];
        popupWindow.popupApi.handleError();

        alert(message);

        chrome.storage.local.get(
            "episodeLinkOffsetIndex",
            function (indexContainer) {
                var index = indexContainer.episodeLinkOffsetIndex;
                chrome.storage.local.set(
                    {
                        "episodeLinkOffsetIndex": index + 1
                    }
                );
            }
        );
    }

    function processVideoHandle(videoHandle) {
        var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];
        popupWindow.popupApi.renderVideoHandle(videoHandle);
    }

    return {
        "processVideoHandle": processVideoHandle,
        "handleIndexOverflow": handleIndexOverflow,
        "handleNegativeEpisodeIndex": handleNegativeEpisodeIndex
    };
})();

chrome.runtime.onMessage.addListener(processResponse);

function processResponse(response) {
    console.log("Background received response:");
    console.log(response);
    if (response.receiver && response.receiver === "background") {
        if (response.actions) {
            response.actions.forEach(function (action) {
                var actionName = action.name;
                backgroundApi[actionName](...action.arguments);
            });
        }
    }
}