import { ACTIONS } from "../constants/actions.js";
import { homeView } from "./view.js";
import { devicesWithMappingsModel } from "../models/device-mappings-model.js";

export const homeController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];

  /**
   * Returns the list of connected devices.
   *
   * @returns {Array<{deviceName: string, vendorId: number, productId: number}>}
   */
  const getConnectedDevices = () => {
    return connectedDevices;
  };

  /**
   * Sets the list of connected devices.
   *
   * @param {Array<{deviceName: string, vendorId: number, productId: number}>}
   *     newConnectedDevices The list of connected devices
   */
  const setConnectedDevices = (newConnectedDevices) => {
    connectedDevices = newConnectedDevices;
  };

  /**
   * Retrieves device mappings from local storage of both mappings by JSON policy
   *     file and the overridden mappings by user then returns the mappings by
   *     the user if found, else it returns mappings of JSON policy file.
   *
   * @returns {DevicesKeysMappings}
   */
  function loadMappingsFromLocalStorage() {
    return devicesWithMappingsModel.loadMappings();
  }

  /**
   * Responsible for broadcasting the action of device disconnetion along with
   *     the device disonnected.
   *
   * @param {string} device Holds device's details on this form name-vid-pid
   */
  function disconnectDevice(device) {
    console.log(`${device} to be disconnected`);
    chrome.runtime.sendMessage({
      action: ACTIONS.DISCONNECT_DEVICE,
      device: device,
    });
  }

  return {
    disconnectDevice,
    getConnectedDevices,
    loadMappingsFromLocalStorage,
    setConnectedDevices,
  };
})();

/**
 * @typedef {Object.<string, DeviceKeysMappings>} DevicesKeysMappings Holds all
 *     devices keymappings. The object's key form is: deviceName-vid-pid.
 */

/**
 * @typedef {Object.<string, MappingInfo} DeviceKeysMappings Holds the device
 *     keys with their corresponding mappings and order to be shown
 */

/**
 * @typedef {Object} MappingInfo
 * @property {number} order Holds the order this key mapping had been added
 * @property {Array<{key: string, keycode: number}>} outputKeys Hold the key to
 *     be shown when the corresponding device key is pressed
 */

/**
 * Asks for user's selection of the needed HID device to connect to.
 *
 * It send a message to service worker to connect to the selected HID device,
 *     and if some error happens, it shows a notification indicating that.
 */
const connectDeviceAttempt = async () => {
  await navigator.hid
    .requestDevice({ filters: [] })
    .then(async (devices) => {
      //after selecting a device send msg to inform background worker of that
      if (devices[0] === undefined) {
        console.log("popup2 device choosing has been canceled 2lmafrood");
        return;
      }
      const device = devices[0];
      console.log(device);
      // To inform the service worker that the device of the pid and vid
      // specified within the message has been granted permission in order
      // to connect to it
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_PERM_UPDATED,
        devicesKeyMappingsSupportedByAdmin:
          devicesWithMappingsModel.getDevicesMainKeyMappings(),
        productId: devices[0]?.productId,
        vendorId: devices[0]?.vendorId,
      });
    })
    .catch((error) => {
      chrome.notifications.create("", {
        title: "Connection Failure",
        message: "Couldn't connect to device, check permissions.",
        type: "basic",
        iconUrl: "./extension-logo.png",
      });
      console.error("Error connecting to HID device:", error);
    });
};

document.addEventListener("DOMContentLoaded", function () {
  devicesWithMappingsModel.loadMappingsFromPolicyFile();
  //requst a device from webHID when button is pressed
  homeView.connectDeviceButtonOnClick(connectDeviceAttempt);

  let inputMode = "normal";
  // To preset the input mode as normal
  chrome.runtime.sendMessage({
    action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
    mode: inputMode,
  });

  homeView.deviceInputModeButtonOnClick(() => {
    if (inputMode === "normal") {
      inputMode = "test";
      homeView.deviceInputModeButtonTextContent.switchToNormalMode();
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
    } else if (inputMode === "test") {
      inputMode = "normal";
      homeView.deviceInputModeButtonTextContent.switchToTestMode();
      chrome.runtime.sendMessage({
        action: ACTIONS.DEVICE_INPUT_MODE_CHANGED,
        mode: inputMode,
      });
    }
  });

  homeView.testInputButtonOnClick(() => {
    chrome.runtime.sendMessage({ action: ACTIONS.TEST_INPUT_SIMULATION });
  });
});

window.addEventListener("load", async () => {
  homeView.showMappings();
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  switch (message.action) {
    case ACTIONS.UPDATE_KEY_MAPPING:
      homeView.showMappings();
      break;

    case ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE:
      console.log(message.connectedDevices);
      /**
       * @type {DevicesKeysMappings}
       */
      const allSupportedDevicesKeyMappings =
        homeController.loadMappingsFromLocalStorage();
      chrome.runtime.sendMessage({
        action: ACTIONS.UPDATE_KEY_MAPPING,
        keyMapping: allSupportedDevicesKeyMappings,
      });
      const connectedDevicesNames = message.connectedDevices.map(
        (connectedDevice) =>
          `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`
      );
      Object.keys(allSupportedDevicesKeyMappings).forEach((supportedDevice) => {
        if (!connectedDevicesNames.includes(supportedDevice)) {
          homeView.deviceDisconnectButton.disable(supportedDevice);
        }
      });
      homeController.setConnectedDevices(message.connectedDevices);

      if (message.connectedDevices?.length > 0) {
        // Make the combination of connected devices names as one string
        let connectedDevicesNames = "";
        homeController
          .getConnectedDevices()
          .forEach((connectedDevice, index) => {
            connectedDevicesNames += `${index == 0 ? "" : ", "}${
              connectedDevice.deviceName
            }`;
            const fullDeviceName = `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`;
            homeView.deviceDisconnectButton.enable(fullDeviceName);
          });
        homeView.updateDevicesConnectedLabel(connectedDevicesNames);
        homeView.testModeButton.enable();
      } else {
        homeView.updateDevicesConnectedLabel();
        homeView.testModeButton.disable();
      }
      break;
  }
});
