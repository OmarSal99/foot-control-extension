import { DEVICES_LIST } from "../constants/devices-list.js";
import { ACTIONS } from "../constants/actions.js";
import { LOCAL_STORAGE } from "../constants/local-storage-keys.js";
import { homeView } from "./home-view.js";
import devicesMappings from "../another-device-mappings.json" assert { type: "json" };

export const homeController = (function () {
  /**
   * @type Array<{deviceName: string, vendorId: number, productId: number}>
   */
  let connectedDevices = [];

  const getConnectedDevices = () => {
    return connectedDevices;
  };

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
    let allsupportedDevicesKeyMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.ALL_DEVICES_KEY_MAPPINGS)
    );
    /**
     * @type {DevicesKeysMappings}
     */
    const userDefinedDevicesKeysMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    );

    if (userDefinedDevicesKeysMappings) {
      allsupportedDevicesKeyMappings = userDefinedDevicesKeysMappings;
    }
    return allsupportedDevicesKeyMappings;
  }

  /**
   *
   * @param {string} device Holds device's details on this form name-vid-pid
   */
  function disconnectDevice(device) {
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
 * @type {DevicesKeysMappings}
 */
let allsupportedDevicesKeyMappings = undefined;

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
        devicesKeyMappingsSupportedByAdmin: allsupportedDevicesKeyMappings,
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
  loadMappings();
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

/**
 * Loads devices' mappings from JSON file loaded from policy admin.
 *
 * Checks what devices the admin permitted, then loads their mappings based on
 *     the extension's support for the mentioned devices.
 */
function loadMappings() {
  const supportedDevices = [];
  // to find what devices are supported are also listed in the JSON config file
  DEVICES_LIST.forEach((device) => {
    const filterResult = devicesMappings.filter((deviceMapping) => {
      return (
        device.driver.vendorId === deviceMapping.vid &&
        device.driver.productId === deviceMapping.pid
      );
    })[0];

    if (filterResult) {
      filterResult["deviceName"] = device.driver.deviceName;
      supportedDevices.push(filterResult);
    }
  });
  console.log(supportedDevices);
  allsupportedDevicesKeyMappings = {};

  for (const device of supportedDevices) {
    const mappings = {};
    allsupportedDevicesKeyMappings[
      `${device.deviceName}-${device.vid}-${device.pid}`
    ] = {};

    for (const [index, value] of Object.keys(device.keyMappings).entries()) {
      const key = value;
      mappings[key] = device.keyMappings[key].outputKeys.map((char) => ({
        key: char,
        keycode: char.charCodeAt(0),
      }));
      allsupportedDevicesKeyMappings[
        `${device.deviceName}-${device.vid}-${device.pid}`
      ][key] = {
        label: device.keyMappings[key].label,
        outputKeys: mappings[key],
        order: index + 1,
      };
    }
    localStorage.setItem(
      LOCAL_STORAGE.ALL_DEVICES_KEY_MAPPINGS,
      JSON.stringify(allsupportedDevicesKeyMappings)
    );
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup2", message);
  //indicate that something changed and recreate the mapping
  if (message.action === ACTIONS.UPDATE_KEY_MAPPING) {
    homeView.showMappings();
  } else if (
    message.action ===
    ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE
  ) {
    console.log(message.connectedDevices);
    const allsupportedDevicesKeyMappings =
      homeController.loadMappingsFromLocalStorage();
    chrome.runtime.sendMessage({
      action: ACTIONS.UPDATE_KEY_MAPPING,
      keyMapping: allsupportedDevicesKeyMappings,
    });
    const connectedDevicesNames = message.connectedDevices.map(
      (connectedDevice) =>
        `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`
    );
    Object.keys(allsupportedDevicesKeyMappings).forEach((supportedDevice) => {
      if (!connectedDevicesNames.includes(supportedDevice)) {
        homeView.deviceDisconnectButton.disable(supportedDevice);
      }
    });
    homeController.setConnectedDevices(message.connectedDevices);
    if (message.connectedDevices?.length > 0) {
      let connectedDevicesNames = "";
      homeController.getConnectedDevices().forEach((connectedDevice, index) => {
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
  }
});
