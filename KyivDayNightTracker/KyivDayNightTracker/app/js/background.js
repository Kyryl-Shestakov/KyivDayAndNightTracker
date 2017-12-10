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

var refererVideoPage;

var backgroundApi = (function () {

    function handleIndexOverflow(message) {
        var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];
        popupWindow.popupApi.handleError();

        chrome.storage.local.get(
            "episodeLinkOffsetIndex",
            function (indexContainer) {
                var index = indexContainer.episodeLinkOffsetIndex;
                chrome.storage.local.set(
                    {
                        "episodeLinkOffsetIndex": index - 1
                    },
                    function() {
                        if (
                            confirm(message + " Do you want to load more posts?")
                        ) {
                            chrome.tabs.query(
                                {
                                    "active": true,
                                    "currentWindow": true
                                },
                                function (tabs) {
                                    var tab = tabs[0];
                                    var tabId = tab.id;

                                    chrome.tabs.sendMessage(
                                        tabId,
                                        {
                                            "sender": "background",
                                            "receiver": "mainContentScript",
                                            "actions": [
                                                {
                                                    "type": "routine",
                                                    "name": "loadMorePosts",
                                                    "arguments": []
                                                }
                                            ]
                                        }
                                    );
                                }
                            );
                        }
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

    function processVideoPostLink(videoPostLink, videoTitle) {
        var videoHandle = {
            "title": videoTitle,
            "links": []
        };

        chrome.storage.local.set(
            {
                "videoHandle": videoHandle
            },
            function() {
                getVideoLinks(
                    videoPostLink,
                    function() {
                        chrome.storage.local.get(
                            "videoHandle",
                            function(videoHandleContainer) {
                                var resultingVideoHandle = videoHandleContainer.videoHandle;
                                processVideoHandle(resultingVideoHandle);
                            }
                        );

                    }
                );
            }
        );
    }

    function getVideoLinks(episodePageLink, callback) {
        refererVideoPage = episodePageLink;
        loadWebPage(episodePageLink, processFirstVideoPageText, callback);
    }

    function loadWebPage(href, callback, externalCallback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var result = this.responseText;
                callback(result, externalCallback);
            }
        };

        // TODO: implement more complex logic of schema prepending
        var url = href.startsWith("https://") ? href : ("https:" + href); 
        xhr.open("GET", url, true);
        xhr.send();
    }

    function processFirstVideoPageText(videoPageText, callback) {
        var videoFrameLink = /((https?:)?\/\/)?player\.novy\.tv\/embed\/(\d|[a-f])+/ig.exec(videoPageText)[0];

        var secondPartText = "Дивіться онлайн 2 частина";

        if (
            videoPageText.includes(secondPartText)
        ) {
            var secondVideoPartPageLink = /kyivdennoch\.novy\.tv\/ua\/videos\/episode\/kiev-dnem-i-nochyu-smotret-onlayn-seria-\d\d-ot-\d\d.\d\d.\d\d\d\d-sezon-\d-chast-2/ig.exec(videoPageText)[0];

            loadWebPage(
                videoFrameLink,
                processVideoFrameText,
                function () {
                    loadWebPage(
                        secondVideoPartPageLink,
                        processSecondVideoPageText,
                        callback
                    );
                }
            );
        } else {
            loadWebPage(videoFrameLink, processVideoFrameText, callback);
        }
    }

    function processSecondVideoPageText(videoPageText, callback) {
        var videoFrameLink = /((https?:)?\/\/)?player\.novy\.tv\/embed\/(\d|[a-f])+/ig.exec(videoPageText)[0];

        loadWebPage(videoFrameLink, processVideoFrameText, callback);
    }

    function processVideoFrameText(videoFrameText, callback) {
        var videoLink = /https:\/\/edge-vcms\.novy\.tv\/files\/\d\d\/\d\d\/\d+\/origin.mp4/gi.exec(videoFrameText)[0];

        chrome.storage.local.get(
            "videoHandle",
            function(videoHandleContainer) {
                var videoHandle = videoHandleContainer.videoHandle;
                videoHandle.links.push(videoLink);
                chrome.storage.local.set(
                    {
                        "videoHandle": videoHandle
                    },
                    function () {
                        callback();
                    }
                );
            }
        );
    }

    return {
        "processVideoHandle": processVideoHandle,
        "handleIndexOverflow": handleIndexOverflow,
        "handleNegativeEpisodeIndex": handleNegativeEpisodeIndex,
        "processVideoPostLink": processVideoPostLink
    };
})();

chrome.runtime.onMessage.addListener(processResponse);

function processResponse(response) {
    console.log("Background received response:");
    console.log(response);

    if (
        response.receiver &&
        response.receiver === "background" &&
        response.actions
    ) {
        response.actions.forEach(function (action) {
            var actionName = action.name;
            var actionArguments = action.arguments;

            backgroundApi[actionName](...actionArguments);
        });
    }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    manipulateRequest,
    { urls: ["*://player.novy.tv/embed/*"] },
    ["blocking", "requestHeaders"]
);

function manipulateRequest(details) {
    details.requestHeaders.push({
        name: "Referer",
        value: refererVideoPage
    });
    return {
        requestHeaders: details.requestHeaders
    };
}