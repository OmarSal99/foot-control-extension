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
  const devices = await navigator.hid.getDevices();
  console.log("devices are", devices);
  // update the keymapping based on the object from the popup
  if (message.action == ACTIONS.UPDATE_KEY_MAPPING) {
    keyMapping = message.keyMapping;
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
    return;
  }
  if (message.action == ACTIONS.DEVICE_PERM_UPDATED) {
    const devicesWithPermissions = await navigator.hid.getDevices();
    deviceToBind = devicesWithPermissions.filter((deviceElement) => {
      return (
        deviceElement.productId == message.productId &&
        deviceElement.vendorId == message.vendorId
      );
    })[0];
    try {
        await deviceToBind.open();
        bindDeviceEntry(deviceToBind);
      } catch (error) {
        console.error("Failed to open HID device");
      }
  }
});

function handleKeyInput(key) {
    if (chrome.runtime?.id) {
      console.log("from inside!!");
      if (forwardInputToPopup) {
        chrome.runtime.sendMessage({
          action: ACTIONS.INPUT_KEY_PRESSED,
          key: key,
        });
      } else {
        chrome.runtime.sendMessage({
          action: ACTIONS.KEY_EVENT,
          key: key,
        });
      }
    }
  }

const gamepadControllerEntryHandler = (function () {
    let lastEntryTime = 0;
    const onHIDEntry = (event) => {
      const { data, device, reportId } = event;
      let uint8Array = new Uint8Array(data.buffer);
      const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
      // The following strings within the condition represent neutral entries by the device
      if (
        base64String !== "f39/f38PAMA=" &&
        base64String !== "f39+f38PAMA=" &&
        base64String !== "f3+Af38PAMA=" &&
        base64String !== "f399f38PAMA=" &&
        base64String !== "f3+Bf38PAMA=" &&
        base64String !== "f3+Cf38PAMA="
      ) {
        const currentTime = new Date().getTime();
        if (currentTime - lastEntryTime > 1000) {
          console.log("Different entry");
          console.log(base64String);
          uint8Array[2] = 127;
          console.log(base64String);
          console.log(uint8Array);
          lastEntryTime = currentTime;
          handleKeyInput(base64String);
        }
      }
    };
    return {
      onHIDEntry,
    };
  })();
  
  // HID devices supported
  const DEVICES_LIST = [
    Object.freeze({
      device: "hpMouse",
      vendorId: 0x03f0,
      productId: 0x0150,
      usagePage: 0x0001,
    }),
    Object.freeze({
      device: "joystick",
      vendorId: 0x0079,
      productId: 0x0006,
      usagePage: 0x0001,
      entryHandler: gamepadControllerEntryHandler.onHIDEntry,
    }),
  ];

const bindDeviceEntry = (hidDevice) => {
    const deviceUnderUse = DEVICES_LIST.filter((deviceElement) => {
      return (
        deviceElement.productId == hidDevice.productId &&
        deviceElement.vendorId == hidDevice.vendorId
      );
    })[0];
    hidDevice.addEventListener("inputreport", (event) => {
      deviceUnderUse.entryHandler(event);
    });
  };

chrome.storage.local.get(
  KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE,
  function (result) {
    keyMapping = result[KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE];
  }
);
if (keyMapping === undefined) keyMapping = {};
