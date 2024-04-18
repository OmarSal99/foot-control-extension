import { ACTIONS } from "./actions.js";
const LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS = "all devices key mappings";
const LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS =
  "devices key mappings set by the user";

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
let allsupportedDevicesKeyMappings = {};

/**
 * @type Array<{deviceName: string, vendorId: number, productId: number}>
 */
let connectedDevices = [];

//store inputinterval id which will be used to clear it when it's done
//the interval sends msgs to background rapidly to inform it that the user is in the input field so it pass the input from the device to the popup
let inputIntervalId = null;

//initial function that will run when the device changes (or when open the popup for the first time)
//it load the stored data for that device name to the ui and update keymapping
function createMapping() {
  if (connectedDevices.length > 0) {
    allsupportedDevicesKeyMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS)
    );
    const userDefinedDevicesMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS)
    );

    if (userDefinedDevicesMappings) {
      allsupportedDevicesKeyMappings = userDefinedDevicesMappings;
    }

    if (allsupportedDevicesKeyMappings) {
      const devicesMappingsSpaceElement =
        document.getElementById("devices-mappings");
      connectedDevices.forEach((connectedDevice) => {
        const deviceSpaceElement = document.createElement("div");
        const deviceNameVIDPIDAsKey = `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`;
        deviceSpaceElement.setAttribute("id", deviceNameVIDPIDAsKey);
        deviceSpaceElement.setAttribute("class", "device-space");
        console.log(deviceNameVIDPIDAsKey);
        const deviceNameElement = document.createElement("h3");
        deviceNameElement.textContent = connectedDevice.deviceName;
        const addKeyMappingButton = document.createElement("button");
        addKeyMappingButton.setAttribute("type", "button");
        addKeyMappingButton.style.alignSelf = "flex-start";
        addKeyMappingButton.textContent = "Add new mapping";
        addKeyMappingButton.addEventListener("click", () => {
          const newMapping = addNewMapping();
          deviceSpaceElement.insertBefore(newMapping, addKeyMappingButton);
        });
        deviceSpaceElement.appendChild(deviceNameElement);
        for (
          let i = 0;
          i <
          Object.keys(allsupportedDevicesKeyMappings[deviceNameVIDPIDAsKey])
            ?.length;
          i++
        ) {
          Object.keys(
            allsupportedDevicesKeyMappings[deviceNameVIDPIDAsKey]
          ).forEach((deviceInputKey) => {
            if (
              allsupportedDevicesKeyMappings[deviceNameVIDPIDAsKey][
                deviceInputKey
              ].order ==
              i + 1
            ) {
              let mapping = addNewMapping();
              mapping.querySelector(".input-key").value = deviceInputKey;
              let outputField = mapping.querySelector(".output-key");
              const outputKeys =
                allsupportedDevicesKeyMappings[deviceNameVIDPIDAsKey][
                  deviceInputKey
                ].outputKeys;
              outputField.value = outputKeys[0].key;
              outputField.setAttribute("keycode", outputKeys[0].keycode);
              for (let i = 1; i < outputKeys.length; i++) {
                let newOutputField = addOutputField(
                  mapping.querySelector(".output-container")
                );
                newOutputField.value = outputKeys[i].key;
                newOutputField.setAttribute("keycode", outputKeys[i].keycode);
              }
              deviceSpaceElement.appendChild(mapping);
            }
          });
        }
        deviceSpaceElement.appendChild(addKeyMappingButton);
        devicesMappingsSpaceElement.appendChild(deviceSpaceElement);
      });
    }
  }
}

//this run every time user change something in the ui, it distroy the old keymapping and rebuild it based on the ui
//a msg indicate that the mapping update is sent with the new mapping
function updateMapping() {
  allsupportedDevicesKeyMappings = retrieveMappingsFromUI();
  localStorage.setItem(
    LOCAL_STORAGE_USER_EDITED_DEVICES_KEY_MAPPINGS,
    JSON.stringify(allsupportedDevicesKeyMappings)
  );
  chrome.runtime.sendMessage({
    action: ACTIONS.UPDATE_KEY_MAPPING,
    keyMapping: allsupportedDevicesKeyMappings,
  });
}

function retrieveMappingsFromUI() {
  const allSupportedDevicesMappings = {};
  for (const connectedDevice of connectedDevices) {
    const someDeviceKeyMappings = {};
    const device = `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`;
    const deviceMappingsHolderElement = document.getElementById(device);
    const keyMappingList =
      deviceMappingsHolderElement.querySelectorAll(".key-mapping");
    const inputKeys = [];
    Array.from(keyMappingList).forEach((parentDiv, index) => {
      let inputKey = parentDiv.querySelector(".input-key").value;

      if (inputKey === "" || inputKeys.includes(inputKey)) {
        parentDiv.querySelector(".input-key").value = "";
        parentDiv.remove();
        return;
      }
      inputKeys.push(inputKey);
      let outputFields = parentDiv.querySelectorAll(".output-key");
      someDeviceKeyMappings[inputKey] = { outputKeys: [], order: index + 1 };
      for (let i = 0; i < outputFields.length; i++) {
        if (outputFields[i].value !== "") {
          someDeviceKeyMappings[inputKey].outputKeys.push({
            key: outputFields[i].value,
            keycode: outputFields[i].getAttribute("keycode"),
          });
        }
      }
    });
    allSupportedDevicesMappings[device] = someDeviceKeyMappings;
  }
  return allSupportedDevicesMappings;
}

// delete a key mapping (row)
function deleteMapping(event) {
  let parentDiv = event.target.parentNode.parentNode;
  parentDiv.remove();
  updateMapping();
}

//create output field and place it inside this
function addOutputField(parentDiv) {
  let outputField = createOutputField();
  parentDiv.appendChild(outputField);
  return outputField;
}

function createOutputField() {
  let outputKey = document.createElement("input");
  outputKey.type = "text";
  outputKey.classList.add("output-key");
  outputKey.setAttribute("keycode", "");
  outputKey.onkeydown = function (event) {
    outputKey.value = event.key;
    outputKey.setAttribute(
      "keycode",
      event.key.match(/^[a-z]$/) ? event.key.charCodeAt(0) : event.keyCode
    );
    event.preventDefault();
    updateMapping();
  };
  return outputKey;
}

/**
 * Send an action to service worker to tell it that the entry of the device is
 *     to take it as raw not converted to the mapping set.
 */
function setInputInterval() {
  if (inputIntervalId !== null) clearInterval(inputIntervalId);
  inputIntervalId = setInterval(() => {
    chrome.runtime.sendMessage({
      action: ACTIONS.POPUP_IN_INPUT_FIELD,
    });
  }, 100);
}

/**
 * Adds new mapping row.
 *
 * @returns {HTMLElement}
 */
function addNewMapping() {
  const mappingDiv = document.createElement("div");
  mappingDiv.setAttribute("id", "mapping-space");
  const newMapping = document.createElement("div");
  newMapping.classList.add("key-mapping");
  const keyAndMappingHolder = document.createElement("div");
  keyAndMappingHolder.setAttribute("class", "gapped-row");

  const inputKeyLabel = document.createElement("label");
  inputKeyLabel.innerHTML = "Key:";
  inputKeyLabel.classList.add("input-key-label");
  const inputKey = document.createElement("input");
  inputKey.type = "text";
  inputKey.classList.add("input-key");
  inputKey.onkeyup = (event) => {
    updateMapping();
  };
  inputKey.addEventListener("focus", function () {
    setInputInterval();
  });
  inputKey.addEventListener("blur", function () {
    clearInterval(inputIntervalId);
    inputIntervalId = null;
  });

  const inputLabelValueWrapper = document.createElement("div");
  inputLabelValueWrapper.setAttribute("class", "label-value-pair");
  inputLabelValueWrapper.appendChild(inputKeyLabel);
  inputLabelValueWrapper.appendChild(inputKey);
  keyAndMappingHolder.append(inputLabelValueWrapper);

  const outputKeyLabel = document.createElement("label");
  outputKeyLabel.innerHTML = "Mapping:";
  outputKeyLabel.classList.add("output-key-label");
  const outputContainer = document.createElement("div");
  outputContainer.classList.add("output-container");
  const outputKey = createOutputField();

  const outputLabelValueWrapper = document.createElement("div");
  outputLabelValueWrapper.setAttribute("class", "label-value-pair");
  outputLabelValueWrapper.appendChild(outputKeyLabel);
  outputContainer.appendChild(outputKey);
  outputLabelValueWrapper.appendChild(outputContainer);
  keyAndMappingHolder.appendChild(outputLabelValueWrapper);

  newMapping.appendChild(keyAndMappingHolder);

  const addDeleteButtonsWrapper = document.createElement("div");
  addDeleteButtonsWrapper.setAttribute("class", "gapped-row");
  addDeleteButtonsWrapper.setAttribute("style", "margin-bottom: 10px;");

  const addFieldButton = document.createElement("button");
  addFieldButton.innerHTML = "+";
  addFieldButton.classList.add("add-field-button");

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "X";
  deleteButton.classList.add("delete-button");

  keyAndMappingHolder.appendChild(addFieldButton);
  keyAndMappingHolder.appendChild(deleteButton);

  newMapping.appendChild(addDeleteButtonsWrapper);
  mappingDiv.appendChild(newMapping);
  addFieldButton.addEventListener("click", (event) => {
    addOutputField(
      event.target.parentNode.parentNode.querySelector(".output-container")
    );
  });
  deleteButton.addEventListener("click", deleteMapping);
  return newMapping;
}

function connectDeviceSelection() {
  //to allow background in an extension to connect and use webHID it needs to ask the user to give access to that device
  //this can only done in a tab for the extension (you can't request it from the normal popup)
  //and it require chrome version 117+

  //get chrome version
  let version = parseInt(
    /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1].match(/\d+/)[0],
    10
  );
  //if chrome version is 117+ it will open popup2 so the user can select the device
  if (typeof version === "number" && version >= 117) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup2.html") });
  } else {
    //inform the user that chrome need to be updated
    document.getElementById("device-name").innerHTML =
      "pls update chrome to use this feature!";
  }
}

window.addEventListener("load", async () => {
  console.log("popup opened");
  console.log(Date());
  //bind buttons and request the device name from the background
  document
    .getElementById("connect-device-button")
    .addEventListener("click", connectDeviceSelection);
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
    connectedDevices = message.connectedDevices;
    updateConnectedDevicesNamesField();
    if (message.connectedDevices?.length <= 0) {
      console.log("from popup action DEVICE_CHANGED, device name undefined");
      clearDevicesMappingsSpace();
      return;
    } else {
      createMapping();
    }
  }
});

/**
 * Responsible for updating the names of the connected device within the
 *     correspoding field.
 */
function updateConnectedDevicesNamesField() {
  const devicesNamesField = document.getElementById("device-name");
  if (connectedDevices > 0) {
    devicesNamesField.innerHTML = `Connected devices:`;
  } else {
    devicesNamesField.innerHTML = "No device connected.";
  }
}

/**
 * Clears the mappings shown for the devices.
 */
function clearDevicesMappingsSpace() {
  document.getElementById("devices-mappings").innerHTML = "";
}
