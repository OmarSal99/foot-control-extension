import { ACTIONS } from "../constants/actions.js";
import { LOCAL_STORAGE } from "../constants/local-storage-keys.js";
import { popupView } from "./popup-view.js";

export const popupController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];
  let inputIntervalId = null;
  /**
   * @typedef {Object} MappingInfo
   * @property {number} order Holds the order this key mapping had been added
   * @property {Array<{key: string, keycode: number}>} outputKeys Hold the key to
   *     be shown when the corresponding device key is pressed
   */

  /**
   * @typedef {Object.<string, MappingInfo} DeviceKeysMappings Holds the device
   *     keys with their corresponding mappings and order to be shown
   */

  /**
   * @typedef {Object.<string, DeviceKeysMappings>} DevicesKeysMappings Holds all
   *     devices keymappings. The object's key form is: deviceName-vid-pid.
   */

  /**
   * @type {DevicesKeysMappings}
   */
  let allSupportedDevicesKeyMappings = {};

  /**
   * Send an action to service worker to tell it that the entry of the device is
   *     to take it as raw not converted to the mapping set.
   */
  const setInputInterval = () => {
    if (inputIntervalId !== null) clearInterval(inputIntervalId);
    inputIntervalId = setInterval(() => {
      chrome.runtime.sendMessage({
        action: ACTIONS.POPUP_IN_INPUT_FIELD,
      });
    }, 100);
  };

  //this run every time user change something in the ui, it distroy the old keymapping and rebuild it based on the ui
  //a msg indicate that the mapping update is sent with the new mapping
  const updateMapping = () => {
    allSupportedDevicesKeyMappings = popupView.retrieveMappingsFromUI();
    localStorage.setItem(
      LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS,
      JSON.stringify(allSupportedDevicesKeyMappings)
    );
    chrome.runtime.sendMessage({
      action: ACTIONS.UPDATE_KEY_MAPPING,
      keyMapping: allSupportedDevicesKeyMappings,
    });
  };

  const loadMappingsFromLocalStorage = () => {
    allSupportedDevicesKeyMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.ALL_DEVICES_KEY_MAPPINGS)
    );
    const userDefinedDevicesMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    );

    if (userDefinedDevicesMappings) {
      allSupportedDevicesKeyMappings = userDefinedDevicesMappings;
    }

    console.log(allSupportedDevicesKeyMappings);
  };

  const getAllSupportedDevicesKeyMappings = () => {
    return allSupportedDevicesKeyMappings;
  };

  const setAllSupportedDevicesKeyMappings = (
    newAllSupportedDevicesKeyMappings
  ) => {
    allSupportedDevicesKeyMappings = newAllSupportedDevicesKeyMappings;
  };

  return {
    connectedDevices,
    getAllSupportedDevicesKeyMappings,
    inputIntervalId,
    loadMappingsFromLocalStorage,
    setAllSupportedDevicesKeyMappings,
    setInputInterval,
    updateMapping,
  };
})();

window.addEventListener("load", async () => {
  //bind buttons and request the device name from the background
  document
    .getElementById("connect-device-button")
    .addEventListener("click", popupView.connectDeviceSelection);
  getDeviceName();
});

async function getDeviceName() {
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
}

//add listeners to msgs
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup");
  console.log(message);
  if (message.action === ACTIONS.INPUT_KEY_PRESSED) {
    //service worker sends msg that a key pressed (on the device) only if the user is inside input field
    let focusedInput = document.activeElement;
    if (focusedInput.classList.contains("input-key")) {
      focusedInput.value = message.key;
      updateMapping();
    }
    console.log("Input key press deactivated");
  } else if (
    message.action ===
    ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE
  ) {
    popupController.connectedDevices = message.connectedDevices;
    popupView.updateConnectedDevicesNamesField();
    if (message.connectedDevices?.length <= 0) {
      console.log("from popup action DEVICE_CHANGED, device name undefined");
      popupView.clearDevicesMappingsSpace();
    } else {
      popupView.createMapping();
    }
  }
});
