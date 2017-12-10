var popupApi = (function () {
    function preparePopup() {
        console.log("Popup preparing");

        document.getElementById("nextLink")
            .addEventListener("click",
                function () {
                    chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                        function (indexContainer) {
                            var index = indexContainer.episodeLinkOffsetIndex;
                            if (index > 0) {
                                startTheLoader();
                                chrome.storage.local.set(
                                    {
                                        "episodeLinkOffsetIndex": index - 1
                                    },
                                    queryVideoPost
                                );
                            }
                        }
                    );
                }
            );

        document.getElementById("prevLink")
            .addEventListener("click",
                function () {
                    startTheLoader();
                    chrome.storage.local.get(
                        "episodeLinkOffsetIndex", //dependency 4 - index
                        function (indexContainer) {
                            var index = indexContainer.episodeLinkOffsetIndex;
                            chrome.storage.local.set(
                                {
                                    "episodeLinkOffsetIndex": index + 1
                                },
                                queryVideoPost
                            );
                        }
                    );
                }
            );

        document.getElementById("copyButton")
            .addEventListener("click",
                function () {
                    document.getElementById("mediaPlayerRunCommand").select();
                    document.execCommand("Copy", false, null);
                });

        chrome.storage.local.set(
            {
                "episodeLinkOffsetIndex": 0
            },
            queryVideoPost
        );
    }

    function queryForLinks() {
        startTheLoader();

        chrome.tabs.query(
            {
                "active": true,
                "currentWindow": true
            },
            function (tabs) {
                var tab = tabs[0];
                var tabId = tab.id;

                chrome.storage.local.get(
                    "episodeLinkOffsetIndex", //dependency 4 - index
                    function (indexContainer) {
                        var index = indexContainer.episodeLinkOffsetIndex;

                        chrome.tabs.sendMessage(
                            tabId,
                            {
                                "sender": "popup",
                                "receiver": "mainContentScript",
                                "actions": [
                                    {
                                        "type": "routine",
                                        "name": "digForLinks",
                                        "arguments": [index]
                                    }
                                ]
                            }
                        );
                    }
                );
            }
        );
    }

    function queryVideoPost() {
        startTheLoader();

        chrome.tabs.query(
            {
                "active": true,
                "currentWindow": true
            },
            function (tabs) {
                var tab = tabs[0];
                var tabId = tab.id;

                chrome.storage.local.get(
                    "episodeLinkOffsetIndex", //dependency 4 - index
                    function (indexContainer) {
                        var index = indexContainer.episodeLinkOffsetIndex;

                        chrome.tabs.sendMessage(
                            tabId,
                            {
                                "sender": "popup",
                                "receiver": "mainContentScript",
                                "actions": [
                                    {
                                        "type": "routine",
                                        "name": "getVideoPostLink",
                                        "arguments": [index]
                                    }
                                ]
                            }
                        );
                    }
                );
            }
        );
    }

    function stopTheLoader() {
        document.getElementsByClassName("loader")[0].style.display = "none";
    }

    function startTheLoader() {
        document.getElementsByClassName("loader")[0].style.display = "block";
    }

    function renderVideoHandle(videoHandle) {
        var linkList = document.getElementById("linkList");
        linkList.innerHTML = "";

        var episodeTitle = document.getElementById("episodeTitle");
        episodeTitle.innerText = videoHandle.title;

        var shortHandTitle = videoHandle.title.substring(0, videoHandle.title.indexOf("."));
        console.log(shortHandTitle);

        for (var i = 0; i < videoHandle.links.length; ++i) {
            var link = document.createElement("a");
            link.href = videoHandle.links[i];
            link.className = "list-group-item";
            link.target = "_blank"; //the video should open in a new tab
            link.innerText = shortHandTitle +
                ((videoHandle.links.length > 1) ?
                (". \u0427\u0430\u0441\u0442\u0438\u043D\u0430 " + (i + 1)) : ""); //Spells out the word 'part' in ukrainian
            linkList.appendChild(link);
        }

        var mediaPlayerPath = document.getElementById("mediaPlayerPath").value;
        var runCommandText = document.getElementById("mediaPlayerRunCommand");

        var linkString = "";

        for (var j = 0; j < videoHandle.links.length; ++j) {
            linkString += videoHandle.links[j] + " ";
        }

        runCommandText.value = "cmd.exe /K \"cd /d " +
            mediaPlayerPath.charAt(0) + ": & start \"kdn\" " +
            mediaPlayerPath + " " +
            linkString + "& exit\"";

        stopTheLoader();
    }

    function handleError() {
        stopTheLoader();
    }

    return {
        "preparePopup": preparePopup,
        "renderVideoHandle": renderVideoHandle,
        "handleError": handleError
    };
})();

document.addEventListener("DOMContentLoaded", popupApi.preparePopup);