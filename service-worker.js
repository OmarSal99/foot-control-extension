import { ACTIONS } from "./actions.js";
let keyMapping = {};

const KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE =
  "footPedalKeyMappingBackGround";

// send command and return a promise, the promise is resolved when sending command is done to do clean up
function sendCommand(tabs, key) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(
      { tabId: tabs[0].id },
      "Input.dispatchKeyEvent",
      {
        type: "keyDown",
        windowsVirtualKeyCode: key,
        nativeVirtualKeyCode: key,
        macCharCode: key,
        text: String.fromCharCode(key),
      },
      () => {
        // test it it actually wait
        //setTimeout(()=>{resolve();}, 2000);
        resolve();
      }
    );
  });
}

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  console.log(message);
  // update the keymapping based on the object from the popup
  if (message.action == ACTIONS.UPDATE_KEY_MAPPING) {
    keyMapping = message.keyMapping;
    //localStorage.setItem(KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE, JSON.stringify(keyMapping));
    // chrome.storage.local
    //   .set({ KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE: keyMapping })
    //   .then(() => {});
      chrome.storage.local.set({ footPedalKeyMappingBackGround: keyMapping }, function() {
        console.log('Data saved in chrome.storage.local from service worker');
      });
    return;
  }
  // a key pressed, process the request
  if (message.action == ACTIONS.KEY_EVENT) {
    let outputKeys = keyMapping[message.key];
    if (!(Array.isArray(outputKeys) && outputKeys.length > 0)) return;
    chrome.tabs.query({ active: true }, function (tabs) {
      chrome.debugger.attach({ tabId: tabs[0].id }, "1.0", function () {
        let i = 0;
        for (i = 0; i < outputKeys.length; i++) {
          let key = outputKeys[i].key;
          let keycode = parseInt(outputKeys[i].keycode, 10);
          let promises = [];
          if (key.length === 1) {
            promises.push(sendCommand(tabs, keycode));
          } else {
            switch (key) {
              case "F5":
                console.log("refresh page !");
                chrome.tabs.query(
                  { active: true, currentWindow: true },
                  function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: ACTIONS.REFRESH_PAGE,
                    });
                  }
                );
                break;
              case "Tab":
                console.log("tab pressed !");
                chrome.tabs.query(
                  { active: true, currentWindow: true },
                  function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: ACTIONS.TAB,
                    });
                  }
                );
                break;
              default:
                break;
            }
          }
          Promise.all(promises)
            .then((results) => {
              console.log("All promises have resolved:", results);

              // Your cleanup code goes here
              chrome.debugger.detach({ tabId: tabs[0].id });
            })
            .catch((error) => {
              console.error("At least one promise was rejected:", error);
            });
        }
      });
    });
  }
});

chrome.storage.local.get(KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE, function(result) {
    keyMapping = result[KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE];
  });
if(keyMapping === undefined) keyMapping = {};