document.addEventListener("DOMContentLoaded", preparePopup);

function queryForLinks() {
    chrome.storage.local.get("tabId",
        function(tabIdContainer) {
            chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                function(indexContainer) {
                    var index = indexContainer.episodeLinkOffsetIndex;
                    var firstIndex = index;
                    var secondIndex = index + 1;

                    chrome.tabs.sendMessage(tabIdContainer.tabId,
                    {
                        "sender": "popup",
                        "actions": [
                            {
                                "type": "routine",
                                "name": "digForLinks",
                                "arguments": [firstIndex, secondIndex]
                            }
                        ]
                    });
                });
        });
}

function preparePopup() {
    console.log("Popup preparing");
    stopTheLoader();

    chrome.storage.local.set({
        "episodeLinkOffsetIndex": 0
    });

    document.getElementById("shiftLeftLink")
        .addEventListener("click",
            function () {
                chrome.storage.local.set({ "postOffset": 1 },
                    function () {
                        chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                            function (indexContainer) {
                                var index = indexContainer.episodeLinkOffsetIndex;
                                if (index > 0) {
                                    startTheLoader();
                                    chrome.storage.local.set({
                                        "episodeLinkOffsetIndex": index - 1
                                    },
                                        queryForLinks);
                                }
                            });
                    });
            });

    document.getElementById("shiftRightLink")
        .addEventListener("click",
            function () {
                startTheLoader();

                chrome.storage.local.set({ "postOffsetAdjustingNumber": -1 },
                    function () {
                        chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                            function (indexContainer) {
                                var index = indexContainer.episodeLinkOffsetIndex;
                                chrome.storage.local.set({
                                    "episodeLinkOffsetIndex": index + 1
                                },
                                    queryForLinks);
                            });
                    });
            });

    document.getElementById("nextLink")
        .addEventListener("click",
            function () {
                chrome.storage.local.set({ "postOffsetAdjustingNumber": 2 },
                    function () {
                        chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                            function (indexContainer) {
                                var index = indexContainer.episodeLinkOffsetIndex;
                                if (index > 1) {
                                    startTheLoader();
                                    chrome.storage.local.set({
                                        "episodeLinkOffsetIndex": index - 2
                                    },
                                        queryForLinks);
                                }
                            });
                    });

            });

    document.getElementById("prevLink")
        .addEventListener("click",
            function () {
                startTheLoader();
                chrome.storage.local.set({ "postOffsetAdjustingNumber": -2 },
                    function () {
                        chrome.storage.local.get("episodeLinkOffsetIndex", //dependency 4 - index
                            function (indexContainer) {
                                var index = indexContainer.episodeLinkOffsetIndex;
                                chrome.storage.local.set({
                                    "episodeLinkOffsetIndex": index + 2
                                },
                                    queryForLinks);
                            });
                    });
            });

    document.getElementById("copyButton")
        .addEventListener("click",
            function () {
                //var firstLink = document.getElementById("firstLink").href;
                //var secondLink = document.getElementById("secondLink").href;

                document.getElementById("mediaPlayerRunCommand").select();
                document.execCommand("Copy", false, null);
            });

    startTheLoader();
    queryForLinks();
}

function stopTheLoader() {
    document.getElementsByClassName("loader")[0].style.display = "none";
}

function startTheLoader() {
    document.getElementsByClassName("loader")[0].style.display = "block";
}