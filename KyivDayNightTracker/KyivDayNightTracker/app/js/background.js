﻿chrome.runtime.onMessage.addListener(processResponse);

//chrome.tabs.query({
//    "active": true,
//    "currentWindow": true
//}, function (tabs) {
//    var intendedUrl = "http://kyivdennoch.novy.tv/ua/episodes/";
//    var tab = tabs[0];
//    var tabId = tab.id;
//    var tabUrl = tab.url;

//    if (tabUrl === intendedUrl) {
//        chrome.pageAction.show(tabId);
//    }
//});

chrome.tabs.onActivated.addListener(function (tabInfo) {
    var tabId = tabInfo.tabId;

    chrome.tabs.get(tabId, function (tab) {
        var intendedUrl = "http://kyivdennoch.novy.tv/ua/episodes/";
        var tabUrl = tab.url;

        if (tabUrl === intendedUrl || tabUrl === "http://kyivdennoch.novy.tv/ua/") {
            chrome.storage.local.set({
                "tabId": tabId
            }, function () {
                chrome.pageAction.show(tabId);
            });
        }
    });
    
});

function checkPage() {
    
}

function processResponse(response) {
    console.log("Background received response:");
    console.log(response);
    if (response.receiver && response.receiver === "background") {
        if (response.actions) {
            response.actions.forEach(function (action) {
                var actionName = action.name;
                window[actionName](...action.arguments);
            });
        }
    }
}

function displayLinks(videoHandles) {
    stopTheLoader();

    var firstLink = videoHandles[0].link;
    var secondLink = videoHandles[1].link;

    var firstVideoName = videoHandles[0].name;
    var secondVideoName = videoHandles[1].name;

    var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];

    var firstLinkPlaceholder = popupWindow.document.getElementById("firstLink");
    firstLinkPlaceholder.innerText = firstVideoName;
    firstLinkPlaceholder.href = firstLink;

    var secondLinkPlaceholder = popupWindow.document.getElementById("secondLink");
    secondLinkPlaceholder.innerText = secondVideoName;
    secondLinkPlaceholder.href = secondLink;

    var mediaPlayerPath = popupWindow.document.getElementById("mediaPlayerPath").value;

    var runCommandText = popupWindow.document.getElementById("mediaPlayerRunCommand");
    runCommandText.value = "cmd.exe /K \"cd /d " + mediaPlayerPath.charAt(0) + ": & start \"kdn\" " + mediaPlayerPath + " " +
        firstLink + " " + secondLink + " & exit\"";
}

function handleIndexOverflow(message) {
    stopTheLoader();
    alert(message);
    chrome.storage.local.get("episodeLinkOffsetIndex",
        function (indexContainer) {
            var index = indexContainer.episodeLinkOffsetIndex;
            chrome.storage.local.get("postOffsetAdjustingNumber",
                function (offsetContainer) {
                    var offset = offsetContainer.postOffsetAdjustingNumber;
                    chrome.storage.local.set({ "episodeLinkOffsetIndex": index + offset });
                });
        });
}

function stopTheLoader() {
    var popupWindow = chrome.extension.getViews({ "type": "popup" })[0];
    popupWindow.document.getElementsByClassName("loader")[0].style.display = "none";
}