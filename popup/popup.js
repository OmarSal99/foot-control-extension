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

  /**
   * Runs every time user changes something in the ui, it destroys the old
   *     keymapping and rebuild it based on the ui, then sends a msg across
   *     the ectension to indicate that the mapping update is sent
   *     with the new mapping
   */
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

  /**
   * Retrieves device mappings from local storage of both mappings by JSON policy
   *     file and the overridden mappings by user then returns the mappings by
   *     the user if found, else it returns mappings of JSON policy file.
   *
   * @returns {DevicesKeysMappings}
   */
  const loadMappingsFromLocalStorage = () => {
    allSupportedDevicesKeyMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS)
    );
    const userDefinedDevicesKeysMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    );

    if (userDefinedDevicesKeysMappings) {
      // To append the newly supported devices.
      const listOfNewSupportedDevices = [];
      Object.keys(allSupportedDevicesKeyMappings).forEach((device) => {
        if (
          !Object.keys(userDefinedDevicesKeysMappings).some(
            (oldDevice) => oldDevice == device
          )
        ) {
          listOfNewSupportedDevices.push(device);
        }
      });

      listOfNewSupportedDevices.forEach((deviceName) => {
        userDefinedDevicesKeysMappings[deviceName] =
          allSupportedDevicesKeyMappings[deviceName];
      });

      // To remove any dropped devices that were supported.
      const devicesToRemove = [];
      Object.keys(userDefinedDevicesKeysMappings).forEach(
        (oldSupportedDevice) => {
          if (
            !Object.keys(allSupportedDevicesKeyMappings).some(
              (device) => device == oldSupportedDevice
            )
          ) {
            devicesToRemove.push(oldSupportedDevice);
          }
        }
      );

      devicesToRemove.forEach((device) => {
        delete userDefinedDevicesKeysMappings[device];
      });
      allSupportedDevicesKeyMappings = userDefinedDevicesKeysMappings;
    }

    return allSupportedDevicesKeyMappings;
  };

  /**
   * Returns all supported devices with their keymappings.
   *
   * @returns {DevicesKeysMappings}
   */
  const getAllSupportedDevicesKeyMappings = () => {
    return allSupportedDevicesKeyMappings;
  };

  /**
   * Permits resetting the devices with their keymappings.
   *
   * @param {DevicesKeysMappings} newAllSupportedDevicesKeyMappings
   */
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
  requestConnectedDevices();
});

async function requestConnectedDevices() {
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
}

//add listeners to msgs
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup");
  console.log(message);
  switch (message.action) {
    case ACTIONS.INPUT_KEY_PRESSED:
      //service worker sends msg that a key pressed (on the device) only if the user is inside input field
      let focusedInput = document.activeElement;

      if (focusedInput.classList.contains("input-key")) {
        focusedInput.value = message.key;
        updateMapping();
      }
      console.log("Input key press deactivated");
      break;
    case ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE:
      popupController.connectedDevices = message.connectedDevices;
      popupView.updateConnectedDevicesNamesField();

      if (message.connectedDevices?.length <= 0) {
        console.log("from popup action DEVICE_CHANGED, device name undefined");
        popupView.clearDevicesMappingsSpace();
      } else {
        popupView.createMapping();
      }
      break;
  }
});
