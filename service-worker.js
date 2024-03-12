import { ACTIONS } from "./actions.js";
import { DEVICES_LIST } from "./Drivers/devices-list.js";
let keyMapping = {};
let debuggerQueue = [];

// this should never be the case but if there is any very rare case apear code can handle it
// a max waiting time before the key input is dropped
const MAX_WAITING_TIME = 3000;
// max loops before key input is dropped
const MAX_LOOPS = 1000;

const KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE = "key mapping service-worker";
const DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE =
  "device details service-worker";

let popupTimer = undefined;
let forwardInputToPopup = false;

// to organize output order
let sendingOutput = null;
let isLocked = false;
let idCounter = 0;

let deviceName = undefined;

let deviceDetails = undefined;

let deviceInputMode = "normal";

navigator.hid.addEventListener("disconnect", ({ device }) => {
  if (
    device?.productId === deviceDetails?.pid &&
    device?.vendorId === deviceDetails?.vid
  ) {
    chrome.notifications.create("", {
      title: `${deviceName} disconnected`,
      message: `${deviceName} device with VID: ${deviceDetails.vid} and PID: ${deviceDetails.pid} has been disconnected.`,
      type: "basic",
      iconUrl: "./extension-logo.png",
    });

    // stored the values of the just disconnected device, and reassigned the
    // values of deviceName & deviceDetails to undefined.
    deviceName = undefined;
    deviceDetails = undefined;
    chrome.runtime.sendMessage({
      action: ACTIONS.DEVICE_CHANGED,
      deviceName: deviceName,
      deviceDetails: deviceDetails,
      x: "hi",
    });
  }
});

let isFirstTime = true;
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
  //if it is the fist time it try to connect to the same device as it was the last time
  //this will called if the service-worker go to sleep and then wakeup
  //if the chrome is closed permissions will be removed next time you open it, so user have to reselect the device to connect to
  // if (isFirstTime === true) {
  //   await new Promise((resolve, reject) => {
  //     chrome.storage.local.get(
  //       DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE,
  //       async function (result) {
  //         if (
  //           result[DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE] !== undefined
  //         ) {
  //           deviceDetails = result[DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE];
  //           await connectDevice(
  //             deviceDetails["productId"],
  //             deviceDetails["vendorId"]
  //           );
  //           // isFirstTime = false;
  //         }
  //         isFirstTime = false;
  //         console.log(
  //           "intial block done at",
  //           new Date().toLocaleTimeString(undefined, { timeStyle: "medium" })
  //         );
  //         resolve();
  //       }
  //     );
  //   });
  // }

  console.log(message);
  switch (message.action) {
    case ACTIONS.UPDATE_KEY_MAPPING:
      console.log("service worker received msg to update the mappings");
      if (message.deviceName === deviceName) {
        keyMapping = message.keyMapping;
        console.log(keyMapping);
      }
      let storageObject = {};
      storageObject[
        KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE + "-" + message.deviceName
      ] = message.keyMapping;
      chrome.storage.local.set(storageObject, function () {});

      break;
    case ACTIONS.KEY_EVENT:
      console.log("keyboard key pressed");
      await handleKeyInput(message.key);
      break;

    case ACTIONS.DEVICE_PERM_UPDATED:
      connectDevice(message.productId, message.vendorId);
      break;

    case ACTIONS.POPUP_IN_INPUT_FIELD:
      forwardInputToPopup = true;
      startPopupTimer();
      break;

    case ACTIONS.DEVICE_INPUT_MODE_CHANGED:
      deviceInputMode = message.mode;
      console.log(deviceInputMode);
      break;

    case ACTIONS.GET_DEVICE_NAME:
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_CHANGED,
        deviceName: deviceName,
        deviceDetails: deviceDetails,
        x: "bye",
      });
      break;
    default:
      break;
  }
});

const handleKeyInput = async (key) => {
  //resolve the input key to it output keys, it make sure that every output only run when the previous one is done

  //if the user is in the input field, there is no output keys instead it just send the input key to the popup
  if (forwardInputToPopup) {
    chrome.runtime.sendMessage({
      action: ACTIONS.INPUT_KEY_PRESSED,
      key: key,
    });
    return;
  }
  let outputKeys = undefined;
  if (deviceInputMode === "normal") {
    outputKeys = keyMapping[key];
  } else {
    outputKeys = [];
    for (const character in key) {
      outputKeys.push({ key: character, keycode: character.charCodeAt(0) });
    }
  }
  // let outputKeys = keyMapping[key];
  console.log("Input from connected device");
  console.log(key);
  if (!(Array.isArray(outputKeys) && outputKeys.length > 0)) return;
  //chrome.tabs.query select the curtrent active and open tab to work in it, it will only be closed after all output keys done
  //that mean even if you changed the tab before the output keys queue is done it will still press the output keys on the tab that you pressed the input keys in
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      let i = 0;
      //loop on the output keys
      for (i = 0; i < outputKeys.length; i++) {
        let key = outputKeys[i].key;
        let keycode = parseInt(outputKeys[i].keycode, 10);
        let myId = idCounter++;
        let process = async (key, keycode, myId) => {
          //to send ouput key to dom we are using a debugger that will send that key to the browser (chrome)
          //and then the browser will send it to the dom, the debugger return a promise if the loop continue to run
          //without waiting for that promise output keys may get mixed and not printed in order!
          //the promise variable hold the actual promise that the debugger return
          let promise = null;
          //myId is a uniqe number (generated by idCounter) to manage which is the next output
          debuggerQueue.push(myId);
          //time started is stored so if the input key is pressed before MAX_WAITING_TIME or more it won't print the output
          let timeStarted = new Date().getTime();
          //same as time but if it extend a number of loops (or if an error happened it prevent inf loop)
          let numberOfLoops = 0;
          //wait for your id to be on top of the queue, then wait to the current process to be finished (it will make islocked false when it done)
          //it will only loop 1 time then wait for sendingOutput promise which will get resolved when the prevois process finish
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
          //this will pop the current id from the top of the queue so the next process id is in top now
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
              case "F11":
                console.log("fullscreen toggle");
                promise = new Promise((resolve, reject) => {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    action: ACTIONS.FULL_SCREEN,
                  });
                  resolve();
                });
                break;
              default:
                break;
            }
          }
          sendingOutput = promise;
          await promise;
          //release the lock after promise is finished
          isLocked = false;
        };
        process(key, keycode, myId);
      }
    }
  );
  return;
};

async function connectDevice(productId, vendorId) {
  let device = undefined;
  // get the device driver that for that pid and vid
  for (let i = 0; i < DEVICES_LIST.length; i++) {
    if (DEVICES_LIST[i].driver.filter(productId, vendorId)) {
      device = DEVICES_LIST[i];
      break;
    }
  }
  if (device === undefined) {
    chrome.notifications.create("", {
      title: "Connection Failure",
      message: "Device not supported.",
      type: "basic",
      iconUrl: "./extension-logo.png",
    });
    console.log("unable to find device in the devices-list");
    return;
  }
  //driver found, send msg for popup to update the mapping to the new device name
  deviceName = device.name;
  console.log(`PID is: ${productId}, VID is: ${vendorId}`);
  // deviceDetails = { pid: productId, vid: vendorId };
  // chrome.runtime.sendMessage({
  //   action: ACTIONS.DEVICE_CHANGED,
  //   deviceName: deviceName,
  //   deviceDetails: deviceDetails,
  //   x: "hi",
  // });
  // console.log("sent device details");
  // //store the details of the last connected device
  // let storageObject = {};
  // storageObject[DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE] = {
  //   deviceName: deviceName,
  //   productId: productId,
  //   vendorId: vendorId,
  // };
  // chrome.storage.local.set(storageObject, function () {});

  try {
    await device.driver.open();
    device.driver.entryHandler(handleKeyInput);
  } catch (error) {
    chrome.notifications.create("", {
      title: "Connection Failure",
      message: "HID device couldn't be opened.",
      type: "basic",
      iconUrl: "./extension-logo.png",
    });
    console.log(error);
    return;
  }

  chrome.notifications.create("", {
    title: "Connection Succeeded",
    message: `${deviceName} with VID: ${vendorId} and PID: ${productId} has been successfully connected.`,
    type: "basic",
    iconUrl: "./extension-logo.png",
  });

  deviceDetails = { pid: productId, vid: vendorId };
  chrome.runtime.sendMessage({
    action: ACTIONS.DEVICE_CHANGED,
    deviceName: deviceName,
    deviceDetails: deviceDetails,
    x: "hi",
  });
  console.log("sent device details");
  //store the details of the last connected device
  let storageObject = {};
  storageObject[DEVICE_DETAILS_SERVICE_WORKER_LOCAL_STORAGE] = {
    deviceName: deviceName,
    productId: productId,
    vendorId: vendorId,
  };
  chrome.storage.local.set(storageObject, function () {});

  //load the new keymapping from the local storage
  // let storageKey = KEY_MAPPING_SERVICE_WORKER_LOCAL_STORAGE + "-" + device.name;
  // await new Promise((resolve, reject) => {
  //   chrome.storage.local.get(storageKey, function (result) {
  //     if (result[storageKey] === undefined) keyMapping = {};
  //     else keyMapping = result[storageKey];
  //     resolve();
  //   });
  // });
}

function startPopupTimer() {
  // Clear the existing timer (if any)
  clearTimeout(popupTimer);

  // Set a new timer for 3 seconds
  popupTimer = setTimeout(function () {
    // Your function to be called after 1 second of inactivity
    forwardInputToPopup = false;
    console.log("popupclosed!");
  }, 1000);
}
