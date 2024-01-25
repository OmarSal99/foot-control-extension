import { ACTIONS } from "./actions.js";
import { DEVICES_LIST } from "./Drivers/devices-list.js";
let keyMapping = {};
let debuggerQueue = [];

// this should never be the case but if there is any very rare case apear code can handle it
// a max waiting time before the key input is dropped
const MAX_WAITING_TIME = 3000;
// max loops before key input is dropped
const MAX_LOOPS = 1000;

const KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE =
  "foot pedal key mapping service-worker";
const LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY = "last connnected HID device";

let popupTimer = undefined;
let forwardInputToPopup = false;
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
  const devices = await navigator.hid.getDevices();
  console.log("devices are", devices);
  // update the keymapping based on the object from the popup
  if (message.action == ACTIONS.UPDATE_KEY_MAPPING) {
    keyMapping = message.keyMapping;
    let storageObject = {};
    storageObject[KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE]=keyMapping;
    chrome.storage.local.set(
      storageObject,
      function () {
        console.log("Data saved in chrome.storage.local from service worker");
      }
    );
    return;
  }
  // a key pressed, process the request
  else if (message.action == ACTIONS.KEY_EVENT) {
    handleKeyInput(message);
  } else if (message.action == ACTIONS.DEVICE_PERM_UPDATED) {
    connectDevice(message.productId, message.vendorId);
  } else if (message.action == ACTIONS.POPUP_IN_INPUT_FIELD) {
    forwardInputToPopup = true;
    startPopupTimer();
  }
});

function handleKeyInput(message){
    if (forwardInputToPopup) {
        chrome.runtime.sendMessage({
          action: ACTIONS.INPUT_KEY_PRESSED,
          key: message.key,
        });
        return;
      }
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
      return;
}

function connectDevice(productId, vendorId) {
  let device = undefined;
  for (let i = 0; i < DEVICES_LIST.length; i++) {
    if (DEVICES_LIST[i].driver.filter(productId, vendorId)) {
      device = DEVICES_LIST[i];
      break;
    }
  }
  if (device === undefined) {
    console.log("unable to find device in the devices-list");
    return;
  }
  let storageObject = {};
  storageObject[LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY] = {productId: productId, vendorId: vendorId};
  chrome.storage.local.set(
    storageObject,
    function () {
      console.log("Data saved in chrome.storage.local from service worker");
    }
  );
  device.driver.open(handleKeyInput);
}

function startPopupTimer() {
  // Clear the existing timer (if any)
  clearTimeout(popupTimer);

  // Set a new timer for 3 seconds
  popupTimer = setTimeout(function () {
    // Your function to be called after 3 seconds of inactivity
    forwardInputToPopup = false;
    console.log("popupclosed!");
  }, 1000);
}

chrome.storage.local.get(
  KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE,
  function (result) {
    keyMapping = result[KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE];
  }
);

chrome.storage.local.get(
  LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY,
  function (result) {
    if(result[LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY] === undefined) return;
    connectDevice(
      result[LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY].productId,
      result[LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY].vendorId
    );
  }
);

if (keyMapping === undefined) keyMapping = {};
