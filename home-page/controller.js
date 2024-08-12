import { ACTIONS } from "../constants/actions.js";
import { homeView } from "./view.js";
import { devicesWithMappingsModel } from "../models/device-mappings-model.js";

export const homeController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];
  let inputIntervalId = null;
  /**
   * Returns the list of connected devices.
   *
   * @returns {Array<{deviceName: string, vendorId: number, productId: number}>}
   */
  const getConnectedDevices = () => {
    return connectedDevices;
  };

  /**
   * Send an action to service worker to tell it that the entry of the device is
   *     to take it as raw not converted to the mapping set.
   */
  const setInputInterval = () => {
    if (inputIntervalId !== null) clearInterval(inputIntervalId);
    inputIntervalId = setInterval(() => {
      console.log("herhehere");
      chrome.runtime.sendMessage({
        action: ACTIONS.POPUP_IN_INPUT_FIELD,
      });
    }, 100);
  };

  const clearInputInterval = () => {
    clearInterval(inputIntervalId);
    inputIntervalId = null;
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
   * @returns {Promise<DevicesKeysMappings>}
   */
  async function loadMappingsFromLocalStorage() {
    const mappings = await devicesWithMappingsModel.loadMappings();
    return mappings;
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

  /**
   * Runs every time user changes something in the ui, it destroys the old
   *     keymapping and rebuild it based on the ui, then sends a msg across
   *     the extension to indicate that the mapping update is sent
   *     with the new mapping
   */
  const updateMapping = async () => {
    /**
     * @type {DevicesKeysMappings}
     */
    const allSupportedDevicesKeyMappings =
      await homeView.retrieveMappingsFromUI();
    await devicesWithMappingsModel.setUserMadeMappings(
      allSupportedDevicesKeyMappings
    );
    console.log("update", allSupportedDevicesKeyMappings);

    chrome.runtime.sendMessage({
      action: ACTIONS.UPDATE_KEY_MAPPING,
      keyMapping: allSupportedDevicesKeyMappings,
    });
  };

  /**
   * Returns all supported devices with their keymappings.
   *
   * @returns {DevicesKeysMappings}
   */
  const getAllSupportedDevicesKeyMappings = async () => {
    const mappings = await devicesWithMappingsModel.getDevicesMainKeyMappings();
    return mappings;
  };

  /**
   * Permits resetting the devices with their keymappings.
   *
   * @param {DevicesKeysMappings} newAllSupportedDevicesKeyMappings
   */
  const setUserMadeKeyMappings = async (newAllSupportedDevicesKeyMappings) => {
    await devicesWithMappingsModel.setUserMadeMappings(
      newAllSupportedDevicesKeyMappings
    );
  };

  return {
    disconnectDevice,
    getConnectedDevices,
    loadMappingsFromLocalStorage,
    setConnectedDevices,
    updateMapping,
    getAllSupportedDevicesKeyMappings,
    setUserMadeKeyMappings,
    clearInputInterval,
    setInputInterval,
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
        console.log("device choosing has been canceled");
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
      console.error("Error connecting to HID device:", error);
    });
};

const downloadJSONConfiguration = async () => {
  const devicesKeyMappings =
    await homeController.loadMappingsFromLocalStorage();
  console.log(devicesKeyMappings);
  const adminConfigurationObject = { devices: { Value: [] } };
  for (const deviceKey of Object.keys(devicesKeyMappings)) {
    let deviceObj = {};
    let [deviceName, vid, pid] = deviceKey.split("-");
    deviceObj.name = deviceName;
    deviceObj.vid = +vid;
    deviceObj.pid = +pid;
    deviceObj.modifiable = devicesKeyMappings[deviceKey].modifiable;
    let mapping = [];
    for (const inputKey of Object.keys(
      devicesKeyMappings[deviceKey].mappings
    )) {
      let mappingObj = {};
      mappingObj.input = inputKey;
      mappingObj.output = devicesKeyMappings[deviceKey].mappings[
        inputKey
      ].outputKeys.map((outputKey) => outputKey.key);
      mapping.push(mappingObj);
    }
    deviceObj.mapping = mapping;
    adminConfigurationObject.devices.Value.push(deviceObj);
  }
  const jsonString = JSON.stringify(adminConfigurationObject);
  console.log(jsonString);
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `admin-policy-configuration-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

document.addEventListener("DOMContentLoaded", async () => {
  await devicesWithMappingsModel.loadMappingsFromPolicyFile();
  //requst a device from webHID when button is pressed
  homeView.connectDeviceButtonOnClick(connectDeviceAttempt);
  homeView.downloadJSONButtonOnClick(downloadJSONConfiguration);
  homeView.showMappings();
  chrome.runtime.sendMessage({
    action: ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS,
  });
});

// window.addEventListener("load", async () => {});

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  switch (message.action) {
    case ACTIONS.INPUT_KEY_PRESSED:
      //service worker sends msg that a key pressed (on the device) only if the user is inside input field
      let focusedInput = document.activeElement;

      if (focusedInput.classList.contains("input-key")) {
        focusedInput.value = message.key;
        homeController.updateMapping();
      }
      console.log("Input key press deactivated");
      break;

    case ACTIONS.UPDATE_KEY_MAPPING:
      homeView.showMappings();
      break;

    case ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE:
      console.log(message.connectedDevices);
      /**
       * @type {DevicesKeysMappings}
       */
      const allSupportedDevicesKeyMappings =
        await homeController.loadMappingsFromLocalStorage();
      chrome.runtime.sendMessage({
        action: ACTIONS.UPDATE_KEY_MAPPING,
        keyMapping: allSupportedDevicesKeyMappings,
      });

      homeController.setConnectedDevices(message.connectedDevices);
      console.log("connected", homeController.getConnectedDevices());

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
      }
      break;
    case ACTIONS.APPEND_NEW_DEVICE_MAPPINGS:
      const { deviceName, vendorId, productId } = message.deviceDetails;
      const allDevicesKeyMappings =
        await homeController.loadMappingsFromLocalStorage();
      allDevicesKeyMappings[`${deviceName}-${vendorId}-${productId}`] = {
        modifiable: true,
        mappings: {},
      };
      await devicesWithMappingsModel.setUserMadeMappings(allDevicesKeyMappings);
      homeView.showMappings();
      break;
    case ACTIONS.MANAGED_STORAGE_UPDATED:
      homeView.showMappings();
      break;
  }
});
