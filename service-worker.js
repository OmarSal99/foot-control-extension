import { ACTIONS } from "./actions.js";
let keyMapping = {};
let debuggerQueue = [];

// this should never be the case but if there is any very rare case apear code can handle it
// a max waiting time before the key input is dropped
const MAX_WAITING_TIME = 3000;
// max loops before key input is dropped
const MAX_LOOPS = 1000;

const KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE =
  "footPedalKeyMappingBackGround";
let sendingOutput = null;
let isLocked = false;
let idCounter = 0;
// send command and return a promise, the promise is resolved when sending command is done to do clean up
function sendCommand(tabs, key) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId: tabs[0].id }, "1.0", async function () {
      await new Promise((resolve, reject) => {
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
            resolve();
          }
        );
      });
      chrome.debugger.detach({ tabId: tabs[0].id }, () => {
        resolve();
      });
    });
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
    chrome.storage.local.set(
      { footPedalKeyMappingBackGround: keyMapping },
      function () {
        console.log("Data saved in chrome.storage.local from service worker");
      }
    );
    return;
  }
  // a key pressed, process the request
  if (message.action == ACTIONS.KEY_EVENT) {
    let outputKeys = keyMapping[message.key];
    if (!(Array.isArray(outputKeys) && outputKeys.length > 0)) return;
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        let i = 0;
        let lastPromise = null;
        for (i = 0; i < outputKeys.length; i++) {
          let key = outputKeys[i].key;
          let keycode = parseInt(outputKeys[i].keycode, 10);
          let myId = idCounter++;
          let process = async (key, keycode, myId) => {
            let promise = null;
            debuggerQueue.push(myId);
            let timeStarted = new Date().getTime();
            let numberOfLoops = 0;
            while (isLocked || debuggerQueue[0] != myId) {
              if (
                numberOfLoops > MAX_LOOPS ||
                timeStarted + MAX_WAITING_TIME < new Date().getTime()
              ) {
                console.log("enter special case !!!");
                try {
                  debuggerQueue.splice(debuggerQueue.indexOf(myId), 1);
                } catch {}
                return;
              }
              await sendingOutput;
              numberOfLoops++;
            }
            isLocked = true;
            debuggerQueue.shift();
            if (key.length === 1) {
              promise = sendCommand(tabs, keycode);
            } else {
              switch (key) {
                case "F5":
                  console.log("refresh page !");
                  promise = new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: ACTIONS.REFRESH_PAGE,
                    });
                    resolve();
                  });
                  break;
                case "Tab":
                  console.log("tab pressed !");
                  promise = new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      action: ACTIONS.TAB,
                    });
                    resolve();
                  });
                  break;
                default:
                  break;
              }
            }
            if (i + 1 == outputKeys.length) lastPromise = promise;
            sendingOutput = promise;
            await promise;
            isLocked = false;
          };
          process(key, keycode, myId);
        }
        //ignore the error, it's a promise but ide don't think so
        await lastPromise;
      }
    );
  }
});

chrome.storage.local.get(
  KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE,
  function (result) {
    keyMapping = result[KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE];
  }
);
if (keyMapping === undefined) keyMapping = {};
