import { ACTIONS } from "../constants/actions.js";
import { popupView } from "./popup-view.js";
import { devicesWithMappingsModel } from "../models/device-mappings-model.js";

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
    /**
     * @type {DevicesKeysMappings}
     */
    const allSupportedDevicesKeyMappings = popupView.retrieveMappingsFromUI();
    devicesWithMappingsModel.setUserMadeMappings(
      allSupportedDevicesKeyMappings
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
    return devicesWithMappingsModel.loadMappings();
  };

  /**
   * Returns all supported devices with their keymappings.
   *
   * @returns {DevicesKeysMappings}
   */
  const getAllSupportedDevicesKeyMappings = () => {
    return devicesWithMappingsModel.getDevicesMainKeyMappings();
  };

  /**
   * Permits resetting the devices with their keymappings.
   *
   * @param {DevicesKeysMappings} newAllSupportedDevicesKeyMappings
   */
  const setAllSupportedDevicesKeyMappings = (
    newAllSupportedDevicesKeyMappings
  ) => {
    devicesWithMappingsModel.setDevicesMainKeyMappings(
      newAllSupportedDevicesKeyMappings
    );
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

/**
 * Sends message to ask for connected devices.
 */
const requestConnectedDevices = () => {
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
};

window.addEventListener("load", async () => {
  //bind buttons and request the device name from the background
  // popupView.connectDeviceButtonOnClick(popupView.connectDeviceSelection);
  document
    .getElementById("connect-device-button")
    .addEventListener("click", popupView.connectDeviceSelection);
  requestConnectedDevices();
});

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
