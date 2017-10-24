var linkDiggingApi = (function () {
    function digForLinks(episodeIndex) {
        var response = {
            "receiver": "",
            "actions": []
        };

        if (episodeIndex < 0) {
            response.receiver = "background";
            response.actions.push({
                "type": "error",
                "name": "handleNegativeEpisodeIndex",
                "arguments": ["Episode index is negative. Only non-negative indeces are allowed.", episodeIndex]
            });
            chrome.runtime.sendMessage(response);
            return;
        }

        var postCount = queryPostCount();
        //TODO: load more posts

        if (episodeIndex >= postCount) {
            response.receiver = "background";
            response.actions.push({
                "type": "error",
                "name": "handleIndexOverflow",
                "arguments": ["There is no corresponding episode for specified index. Load more posts.", episodeIndex]
            });
            chrome.runtime.sendMessage(response);
            return;
        }

        var action = {
            "type": "routine",
            "name": "processVideoHandle",
            "arguments": []
        }

        response.actions.push(action);

        var postOffset = 2; //because episodeIndex starts with zero and the first article is an ad

        var pageLink = document.querySelector("div.medium_list > article:nth-child(" + (episodeIndex + postOffset) + ") > a").href;

        var videoTitle = document.querySelector("div.medium_list > article:nth-child(" + (episodeIndex + postOffset) + ") > a > aside").innerText;

        //TODO: implement determination of link count and their position

        var videoHandle = {
            "title": videoTitle,
            "links": []
        };

        chrome.storage.local.set(
            {
                "videoHandle": videoHandle
            },
            function () {
                getVideoLinks(
                    pageLink,
                    function () {
                        chrome.storage.local.get(
                            "videoHandle",
                            function (videoHandleContainer) {
                                var resultingVideoHandle = videoHandleContainer.videoHandle;
                                response.receiver = "background";
                                action.arguments.push(resultingVideoHandle);
                                chrome.runtime.sendMessage(response);
                            }
                        );
                        
                    }
                );
            }
        );
    }

    function getVideoLinks(episodePageLink, callback) {
        loadWebPage(episodePageLink, processFirstVideoPageDocument, callback);
    }

    function loadWebPage(href, callback, externalCallback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                //var fragment = document.createDocumentFragment();
                //var nodePlaceholder = document.createElement("html");
                //nodePlaceholder.innerHTML = this.responseXML;
                //fragment.appendChild(nodePlaceholder);]
                var placeholderDocument = document.implementation.createHTMLDocument("video");
                placeholderDocument.documentElement.innerHTML = this.responseText;
                callback(placeholderDocument, externalCallback);
            }
        };
        xhr.open("GET", href, true);
        xhr.send();
    }

    function processFirstVideoPageDocument(videoPageDocument, callback) {
        var videoFrameLink = videoPageDocument.querySelector("#video-slider div.cts-col-1 iframe").src;

        var lastDescriptionLink = videoPageDocument.querySelector(".cts-description > p:last-of-type > a");

        if (lastDescriptionLink && lastDescriptionLink.attributes.getNamedItem("href").value.endsWith("chast-2")) {
            var secondVideoPartPageLink = lastDescriptionLink.attributes.getNamedItem("href").value;

            loadWebPage(
                videoFrameLink,
                processVideoFrameDocument,
                function () {
                    loadWebPage(
                        secondVideoPartPageLink,
                        processSecondVideoPageDocument,
                        callback
                    );
                }
            );
        } else {
            loadWebPage(videoFrameLink, processVideoFrameDocument, callback);
        }
    }

    function processSecondVideoPageDocument(videoPageDocument, callback) {
        var videoFrameLink = videoPageDocument.querySelector("#video-slider div.cts-col-1 iframe").src;

        loadWebPage(videoFrameLink, processVideoFrameDocument, callback);
    }

    function processVideoFrameDocument(videoFrameDocument, callback) {
        var videoLink = videoFrameDocument.querySelector("#my-video source[label='mq']").src;
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

    function queryPostCount() {
        //The first article in the post list is an ad, therefore the article count is decreased by one
        var count = document.querySelectorAll("div.constructor-row:first-of-type div.medium_list > article").length - 1;
        return count;
    }

    return {
        "digForLinks": digForLinks
    };
})();

chrome.runtime.onMessage.addListener(processRequest);
console.log("Content Script");

function processRequest(request) {
    console.log("Tab received a request ->");
    console.log(request);

    if (request.sender && request.sender === "popup") {
        if (request.actions) {
            request.actions.forEach(function(action) {
                var actionName = action.name;
                linkDiggingApi[actionName](...action.arguments);
            });
        }
    }
}