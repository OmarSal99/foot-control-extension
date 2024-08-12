import { ACTIONS } from "./constants/actions.js";
import { DEVICES_LIST } from "./constants/devices-list.js";
import { LOCAL_STORAGE } from "./constants/local-storage-keys.js";
import { devicesWithMappingsModel } from "./models/device-mappings-model.js";

chrome.runtime.onStartup.addListener(async () => {
  const devicesWithPermissions = await navigator.hid.getDevices();
  console.log(devicesWithPermissions);
  devicesWithPermissions.forEach(async (device) => {
    if (device.opened) {
      return;
    }
    connectDevice(device.productId, device.vendorId);
  });
});

chrome.tabs.onCreated.addListener(async () => {
  const devicesWithPermissions = await navigator.hid.getDevices();
  console.log(devicesWithPermissions);
  devicesWithPermissions.forEach(async (device) => {
    if (device.opened) {
      return;
    }
    connectDevice(device.productId, device.vendorId);
  });
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "managed") {
    let currentUserMadeKeyMappings =
      await devicesWithMappingsModel.getUserMadeMappings();
    if (!currentUserMadeKeyMappings) {
      currentUserMadeKeyMappings =
        await devicesWithMappingsModel.getDevicesMainKeyMappings();
    }
    const newDeviceMappingsFromPolicy = changes.devices.newValue;
    Object.keys(currentUserMadeKeyMappings).forEach((dev) => {
      let [name, vid, pid] = dev.split("-");
      let policyDevsFilterResult = newDeviceMappingsFromPolicy.filter(
        (policyDevice) => {
          return policyDevice.vid === +vid && policyDevice.pid === +pid;
        }
      );
      if (!policyDevsFilterResult) delete currentUserMadeKeyMappings[dev];
    });
    for (const device of newDeviceMappingsFromPolicy) {
      const deviceKey = `${device.name}-${device.vid}-${device.pid}`;
      if (!device.modifiable) {
        currentUserMadeKeyMappings[deviceKey].modifiable = false;
        const newMappings = {};
        let index = 0;
        for (const mapping of device.mapping) {
          newMappings[mapping.input] = mapping.output.map((char) => ({
            key: char,
            keycode: char.charCodeAt(0),
          }));
          currentUserMadeKeyMappings[
            `${device.name}-${device.vid}-${device.pid}`
          ].mappings[mapping.input] = {
            outputKeys: newMappings[mapping.input],
            order: index + 1,
          };
          index++;
        }
      } else if (!currentUserMadeKeyMappings[deviceKey]) {
        currentUserMadeKeyMappings[deviceKey] = {
          modifiable: device.modifiable,
          mappings: {},
        };
        const mappings = {};
        let index = 0;
        for (const mapping of device.mapping) {
          mappings[mapping.input] = mapping.output.map((char) => ({
            key: char,
            keycode: char.charCodeAt(0),
          }));
          currentUserMadeKeyMappings[
            `${device.name}-${device.vid}-${device.pid}`
          ].mappings[mapping.input] = {
            outputKeys: mappings[mapping.input],
            order: index + 1,
          };
          index++;
        }
      }
    }
    console.log("updated-managed", currentUserMadeKeyMappings);
    await devicesWithMappingsModel.setUserMadeMappings(
      currentUserMadeKeyMappings
    );
    await devicesWithMappingsModel.loadMappings();
    chrome.runtime.sendMessage({
      action: ACTIONS.MANAGED_STORAGE_UPDATED,
    });
  }
});

/**
 * @typedef {Object} CharKeyCodePair
 * @property {string} key Single character string representing the key.
 * @property {number} keycode The keycode associated with the key.
 */

/**
 * @typedef {Object} KeyMapping Represents the mappings of the device inputs
 *     where the device input will play as a key to reach its mappings.
 * @property {CharKeyCodePair[]}
 */

/**
 * @type {KeyMapping}
 */
let keyMapping = {};

let popupTimer = undefined;
let forwardInputToPopup = false;

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

let deviceName = undefined;

/**
 * @type Array<{deviceName: string, vendorId: number, productId: number}>
 */
let connectedDevices = [];

let deviceDetails = undefined;

/**
 * Checks for any HID device of the supported ones disonnection then makes
 *     chrome message through the extension to convey
 *     the device disconnection, and makes notification to notify the user.
 */
navigator.hid.addEventListener("disconnect", ({ device }) => {
  console.log(device);
  // check if the disconnected device is one of the devices that were connected
  const disconnectedDevice = connectedDevices.find(
    (connectedDevice) =>
      connectedDevice.productId == device?.productId &&
      connectedDevice.vendorId == device?.vendorId
  );
  if (disconnectedDevice) {
    connectedDevices = connectedDevices.filter(
      (device) =>
        device.vendorId != deviceDetails.vid &&
        device.productId != deviceDetails.pid
    );
    chrome.runtime.sendMessage({
      action: ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE,
      connectedDevices: connectedDevices,
    });
  }
});

navigator.hid.addEventListener("connect", (event) => {
  console.log("connectconnect");
});
// send command and return a promise, the promise is resolved when sending command is done to do clean up
/**
 * Responsible for making keydown event with the key passed to it using
 *     chrome's debugger.
 *
 * @param {*} tabs
 * @param {string} key The key/char to be made as keydown event.
 * @returns {Promise<undefined>}
 */
function sendCommand(tabs, key, keycode) {
  chrome.tabs.sendMessage(tabs[0].id, {
    action: "keydown",
    data: { key, keycode },
  });
}

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  console.log(message);
  switch (message.action) {
    case ACTIONS.UPDATE_KEY_MAPPING:
      keyMapping = message.keyMapping;
      break;

    case ACTIONS.DEVICE_PERM_UPDATED:
      devicesMappingsSupportedByAdmin =
        message.devicesKeyMappingsSupportedByAdmin;
      connectDevice(message.productId, message.vendorId);
      break;

    case ACTIONS.POPUP_IN_INPUT_FIELD:
      forwardInputToPopup = true;
      startPopupTimer();
      break;

    case ACTIONS.DEVICE_INPUT_MODE_CHANGED:
      deviceInputMode = message.mode;
      break;

    case ACTIONS.REQUEST_CONNECTED_DEVICES_WITH_MAPPINGS:
      chrome.runtime.sendMessage({
        action: ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE,
        connectedDevices: connectedDevices,
      });
      break;

    case ACTIONS.DISCONNECT_DEVICE:
      let deviceDriverToDisconnect = undefined;
      const productId = message.device.split("-")[2];
      const vendorId = message.device.split("-")[1];
      for (let i = 0; i < DEVICES_LIST.length; i++) {
        if (
          DEVICES_LIST[i].driver.productId == productId &&
          DEVICES_LIST[i].driver.vendorId == vendorId
        ) {
          deviceDriverToDisconnect = DEVICES_LIST[i];
          break;
        }
      }
      await deviceDriverToDisconnect.driver.close();
      connectedDevices = connectedDevices.filter(
        (connectedDevice) =>
          connectedDevice.productId != productId ||
          connectedDevice.vendorId != vendorId
      );
      chrome.runtime.sendMessage({
        action: ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE,
        connectedDevices: connectedDevices,
      });
      break;

    default:
      break;
  }
});

/**
 * Responsible for taking the device's entry and reflects it to its
 *     corresponding mapping.
 *
 * @param {string} deviceName
 * @param {number} vendorId
 * @param {number} productId
 * @param {string} key
 */
const handleKeyInput = async (deviceName, vendorId, productId, key) => {
  console.log(
    `typeof vid ${typeof vendorId}, type of pid ${typeof productId}, type of key pressed ${typeof key}`
  );
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

  outputKeys =
    keyMapping[`${deviceName}-${vendorId}-${productId}`].mappings[key]
      ?.outputKeys;
  if (!(Array.isArray(outputKeys) && outputKeys.length > 0)) return;
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      let i = 0;
      //loop on the output keys
      for (i = 0; i < outputKeys.length; i++) {
        const key =
          typeof outputKeys[i].key === "number"
            ? outputKeys[i].key + ""
            : outputKeys[i].key;
        console.log(key);
        // const keycode = parseInt(outputKeys[i].keycode, 10);
        const keycode = outputKeys[i].keycode;
        await sendCommand(tabs, key, keycode);
      }
    }
  );
  return;
};

/**
 * Responsible for connecting the device after checking if it's supported
 *     by the extension and the admin policy.
 *
 * @param {number} productId
 * @param {number} vendorId
 */
async function connectDevice(productId, vendorId) {
  if (!isDevicePermittedToConnect(productId, vendorId)) {
    return;
  }
  let device = undefined;
  // Make sure that the selected device by the user is supported by extension
  for (let i = 0; i < DEVICES_LIST.length; i++) {
    if (
      DEVICES_LIST[i].driver.productId == productId &&
      DEVICES_LIST[i].driver.vendorId == vendorId
    ) {
      device = DEVICES_LIST[i];
      break;
    }
  }

  try {
    await device.driver.open();
    device.driver.setEntryHandler(handleKeyInput);
  } catch (error) {
    console.log(error);
    return;
  }

  deviceName = device.driver.deviceName;
  deviceDetails = { pid: productId, vid: vendorId };
  connectedDevices.push({
    deviceName: deviceName,
    vendorId: vendorId,
    productId: productId,
  });

  if (isNewDevice(productId, vendorId)) {
    chrome.runtime.sendMessage({
      action: ACTIONS.APPEND_NEW_DEVICE_MAPPINGS,
      deviceDetails: {
        deviceName: deviceName,
        vendorId: vendorId,
        productId: productId,
      },
    });
  }

  // Send msg for popups to update the mapping to the new device name
  chrome.runtime.sendMessage({
    action: ACTIONS.BROADCAST_CONNECTED_DEVICES_WITH_MAPPINGS_RESPONSE,
    connectedDevices: connectedDevices,
  });
  console.log("sent device details");
}

/**
 * Checks whether the device is supported by extension and admin policy, and if
 *     it's already connected and makes notification if not.
 *
 * @param {number} productId
 * @param {number} vendorId
 * @returns {boolean} indicating whether the device is permitted to connect to
 *     or not
 */
function isDevicePermittedToConnect(productId, vendorId) {
  let device = undefined;
  // Make sure that the selected device by the user is supported by extension
  for (let i = 0; i < DEVICES_LIST.length; i++) {
    if (
      DEVICES_LIST[i].driver.productId == productId &&
      DEVICES_LIST[i].driver.vendorId == vendorId
    ) {
      device = DEVICES_LIST[i];
      break;
    }
  }

  if (device === undefined) {
    console.log("unable to find device in the devices-list");
    return false;
  }

  // Check if user is trying to connect to already connected device
  if (
    connectedDevices.some(
      (device) => device.productId === productId && device.vendorId === vendorId
    )
  ) {
    console.log("unable to find device in the devices-list");
    return false;
  }
  console.log(`PID is: ${productId}, VID is: ${vendorId}`);
  return true;
}

const isNewDevice = (productId, vendorId) => {
  // Check if the admin policy granted access for the selected device
  let isNewDevice = true;
  chrome.storage.local
    .get(LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS)
    .then((data) => {
      console.log("service-main", data);
    });
  chrome.storage.local
    .get(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    .then((data) => {
      console.log("service-user", data);
    });
  return new Promise((resolve, reject) => {
    chrome.storage.managed.get((data) => {
      console.log("newDvice", data);
      data.devices?.forEach((device) => {
        if (device.pid === productId && device.vid === vendorId) {
          isNewDevice = false;
        }
      });
      resolve(isNewDevice);
    });
  });
};

/**
 * Responsible for forwarding the device's entry for the popup to configure
 *     some the used device's mappings by the user.
 */
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
