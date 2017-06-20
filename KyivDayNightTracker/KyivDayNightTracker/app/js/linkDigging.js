chrome.runtime.onMessage.addListener(processRequest);
console.log("Content Script");

function processRequest(request) {
    console.log("Tab received a request ->");
    console.log(request);

    if (request.sender && request.sender === "popup") {
        if (request.actions) {
            request.actions.forEach(function(action) {
                var actionName = action.name;
                window[actionName](...action.arguments);
            });
        }
    }
}

function digForLinks(firstIndex, secondIndex) {
    var response = {
        "receiver": "",
        "actions": []/*,
        "videoLinks": [],
        "videoNames": []*/
    };

    if (firstIndex < 0) {
        response.receiver = "background";
        response.actions.push({
            "type": "error",
            "name": "handleNegativeFirstIndex",
            "arguments": ["First index is negative. Only non-negative indeces are allowed."]
        });
        chrome.runtime.sendMessage(response);
        return;
    }

    if (secondIndex < 0) {
        response.receiver = "background";
        response.actions.push({
            "type": "error",
            "name": "handleNegativeSecondIndex",
            "arguments": ["Second index is negative. Only non-negative indeces are allowed."]
        });
        chrome.runtime.sendMessage(response);
        return;
    }

    var postCount = queryPostCount();
    //TODO: load more posts
    var maxIndex = Math.max(firstIndex, secondIndex);

    //var loadMorePostsLink = document.getElementById("148274065995e3c443b2c6058b0953bf73db0352f6");

    //document.querySelector("div.medium_list");

    //while (maxIndex >= count) {
    //    loadMorePostsLink.click();
    //}

    if (maxIndex >= postCount) {
        response.receiver = "background";
        response.actions.push({
            "type": "error",
            "name": "handleIndexOverflow",
            "arguments": ["There is no corresponding episode for specified index. Load more posts.", firstIndex, secondIndex]
        });
        chrome.runtime.sendMessage(response);
        return;
    }

    var action = {
        "type": "routine",
        "name": "displayLinks",
        "arguments" : []
    }

    response.actions.push(action);

    var postOffset = 2;

    var firstPageLink = document.querySelector("div.medium_list > article:nth-child(" + (firstIndex + postOffset) + ") > a").href;
    var secondPageLink = document.querySelector("div.medium_list > article:nth-child(" + (secondIndex + postOffset) + ") > a").href;

    var firstVideoPartName = document.querySelector("div.medium_list > article:nth-child(" + (firstIndex + postOffset) + ") > a > aside").innerText;
    var secondVideoPartName = document.querySelector("div.medium_list > article:nth-child(" + (secondIndex + postOffset) + ") > a > aside").innerText;

    var videoHandles = [];

    var firstVideoHandle = {
        "name": "",
        "link": ""
    };

    var secondVideoHandle = {
        "name": "",
        "link": ""
    };

    videoHandles.push(firstVideoHandle, secondVideoHandle);

    firstVideoHandle.name = firstVideoPartName;
    secondVideoHandle.name = secondVideoPartName;

    getVideoLink(firstPageLink, function (firstVideoLink) {
        firstVideoHandle.link = firstVideoLink;

        if (response.receiver !== "background") {
            response.receiver = "background";
        } else {
            action.arguments.push(videoHandles);
            chrome.runtime.sendMessage(response);
        }
    });
    getVideoLink(secondPageLink, function (secondVideoLink) {
        secondVideoHandle.link = secondVideoLink;

        if (response.receiver !== "background") {
            response.receiver = "background";
        } else {
            action.arguments.push(videoHandles);
            chrome.runtime.sendMessage(response);
        }
    });
}

function getVideoLink(href, postCallback) {
    loadVideoPage(href, processVideoPageDocument, postCallback);
}

function loadVideoPage(href, callback, postCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            //var fragment = document.createDocumentFragment();
            //var nodePlaceholder = document.createElement("html");
            //nodePlaceholder.innerHTML = this.responseXML;
            //fragment.appendChild(nodePlaceholder);]
            var placeholderDocument = document.implementation.createHTMLDocument("video");
            placeholderDocument.documentElement.innerHTML = this.responseText;
            callback(placeholderDocument, postCallback);
        }
    };
    xhr.open("GET", href, true);
    xhr.send();
}

function processVideoPageDocument(videoPageDocument, postCallback) {
    var videoFrameLink = videoPageDocument.querySelector("#video-slider div.cts-col-1 iframe").src;

    loadVideoPage(videoFrameLink, processVideoFrameDocument, postCallback);
}

function processVideoFrameDocument(videoFrameDocument, postCallback) {
    var videoLink = videoFrameDocument.querySelector("#my-video source[label='mq']").src;
    postCallback(videoLink);
}

function queryPostCount() {
    //The first article in the post list is an ad, that is why the article count is decreased by one
    var count = document.querySelectorAll("div.constructor-row:first-of-type div.medium_list > article").length - 1;
    return count;
}