const ACTIONS = {
  KEY_EVENT: "key event",
  UPDATE_KEY_MAPPING: "update key mapping",
  REFRESH_PAGE: "refresh page",
  TAB: "tab pressed",
  REQUEST_DEVICE: "request device",
  POPUP_IN_INPUT_FIELD: "popup in input field",
  INPUT_KEY_PRESSED: "input key pressed",
};

const LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY = "last connnected HID device";

/**
 * Wraps the controller event handling related logic.
 *
 */
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

// if it is true the input from the input keys will be sent to the popup otherwise it will be sent to service-worker
let forwardInputToPopup = false;
// there is no way to know if the popup is closed, the timer here will consider it closed in the last msg from it was 1000ms ago
let popupTimer;

//check if the char is a number, used to test demo app against number keys in keyboard
// TODO: remove it in production
function isSingleDigitNumber(str) {
  return /^[0-9]$/.test(str);
}

// inform other parts that a key is pressed,  if isPPopupOpen is true the message should be sent to it
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

/**
 * Opens the device and binds its inputreport event to its handler, in case no device
 *     was passed, then the device stored in local storage will be loaded.
 *
 * @param {?HIDDevice} device The HID to be opened and binded to its entry handler
 */
const connectDevice = async (device) => {
  let deviceToBind = device;
  // In case no device was passed then get the device stored in local storage
  if (!device) {
    const savedDevice = JSON.parse(
      localStorage.getItem(LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY)
    );

    if (!savedDevice) {
      return;
    }
    const devicesWithPermissions = await navigator.hid.getDevices();
    deviceToBind = devicesWithPermissions.filter((deviceElement) => {
      return (
        deviceElement.productId == savedDevice.productId &&
        deviceElement.vendorId == savedDevice.vendorId
      );
    })[0];
  } else {
    deviceToSave = { vendorId: device.vendorId, productId: device.productId };
    localStorage.setItem(
      LAST_CONNECTED_DEVICE_LOCAL_STORAGE_KEY,
      JSON.stringify(deviceToSave)
    );
  }
  try {
    await deviceToBind.open();
    bindDeviceEntry(deviceToBind);
  } catch (error) {
    console.error("Failed to open HID device");
  }
};

/**
 * Binds the entry handler of the device using the devices list to the HID
 *     opened
 *
 * @param {HIDDevice} device The HID opened for entry listening
 */
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

// adding keylisteners to run when a key is pressed
document.addEventListener("keydown", (event) => {
  if (isSingleDigitNumber(event.key)) handleKeyInput(event.key);
});

// Will try to see if there's some device saved in local storage in order to
// open it and bind its inputreport event to its handler
connectDevice();

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

// recieve messages from other parts of the code
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log(message);
  if (message.action == ACTIONS.REFRESH_PAGE) {
    location.reload();
  } else if (message.action == ACTIONS.TAB) {
    const currentFocusedElement = document.activeElement;
    const allInputFields = document.querySelectorAll('input[type="text"]');
    const currentIndex = Array.from(allInputFields).indexOf(
      currentFocusedElement
    );

    // Move focus to the next input field
    const nextIndex = (currentIndex + 1) % allInputFields.length;
    allInputFields[nextIndex].focus();
  } // request button in the pop up is pressed
  else if (message.action == ACTIONS.REQUEST_DEVICE) {
    const devicesSupported = DEVICES_LIST.map((device) => {
      return {
        vendorId: device.vendorId,
        productId: device.productId,
        usagePage: device.usagePage,
      };
    });
    navigator.hid
      .requestDevice({ filters: devicesSupported })
      .then(async (devices) => {
        const handledDevice = devices[0];
        connectDevice(handledDevice);
      })
      .catch((error) => {
        console.error("Error connecting to HID device:", error);
      });
  } else if (message.action == ACTIONS.POPUP_IN_INPUT_FIELD) {
    forwardInputToPopup = true;
    startPopupTimer();
  }
});
