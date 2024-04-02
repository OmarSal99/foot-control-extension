import { DEVICES_LIST } from "./Drivers/devices-list.js";
import { ACTIONS } from "./actions.js";
import devicesMappings from "./devices-mappings.json" assert { type: "json" };

const LOCAL_STORAGE_KEY_MAPPING = "foot pedal key mapping";
const LOCAL_STORAGE_ORDER_LIST = "foot pedal order list";
const LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS = "all devices key mappings";

//dictionary that actually store the mapping, key: []
//the key (string) is the input and the array contains a list of the ouputs
let keyMapping = {};
//a list to store the order of keys from keymapping that apear in the ui
let orderList = [];

let allsupportedDevicesKeyMappings = {};

let connectedDevices = [];

//the current device name that the keymapping is for
let deviceName = undefined;
// The current device details pid and vid
let deviceDetails = undefined;
//store inputinterval id which will be used to clear it when it's done
//the interval sends msgs to background rapidly to inform it that the user is in the input field so it pass the input from the device to the popup
let inputIntervalId = null;

// function loadMappings2() {
//   const supportedDevices = [];
//   const devicesDetails = {};
//   DEVICES_LIST.forEach((device) => {
//     const filterResult = devicesMappings.filter((deviceMapping) => {
//       return (
//         device.driver.vendorId === deviceMapping.vid &&
//         device.driver.productId === deviceMapping.pid
//       );
//     })[0];

//     if (filterResult) {
//       filterResult["deviceName"] = device.name;
//       supportedDevices.push(filterResult);
//     }
//   });
//   console.log(supportedDevices);

//   for (const device of supportedDevices) {
//     const mappings = {};
//     const deviceEntries = [];
//     devicesDetails[device.deviceName] = { vid: device.vid, pid: device.pid };

//     for (const key of Object.keys(device.keyMappings)) {
//       deviceEntries.push(key);
//       mappings[key] = device.keyMappings[key].map((char) => ({
//         key: char,
//         keycode: char.charCodeAt(0),
//       }));
//     }
//     localStorage.setItem(
//       LOCAL_STORAGE_ORDER_LIST +
//         "-" +
//         device.deviceName +
//         "-" +
//         device.vid +
//         "-" +
//         device.pid,
//       JSON.stringify(deviceEntries)
//     );
//     localStorage.setItem(
//       LOCAL_STORAGE_KEY_MAPPING +
//         "-" +
//         device.deviceName +
//         "-" +
//         device.vid +
//         "-" +
//         device.pid,
//       JSON.stringify(mappings)
//     );
//     localStorage.setItem(
//       LOCAL_STORAGE_KEY_MAPPING,
//       JSON.stringify(devicesDetails)
//     );
//     console.log(mappings);
//     console.log(deviceEntries);
//     console.log(device);
//   }
// }

function loadMapping() {
  console.log("went into loadMapping");
  console.log(deviceName);
  console.log(deviceDetails);
  if (deviceName !== undefined && deviceDetails !== undefined) {
    console.log("And into the if of loadMapping");
    const connectedDevice = devicesMappings.filter(
      (device) =>
        device.pid == deviceDetails.pid && device.vid == deviceDetails.vid
    )[0];
    const deviceEntries = [];
    const mappings = {};
    console.log(connectedDevice);
    if (connectedDevice) {
      for (const key of Object.keys(connectedDevice.keyMappings)) {
        deviceEntries.push(key);
        mappings[key] = connectedDevice.keyMappings[key].map((char) => ({
          key: char,
          keycode: char.charCodeAt(0),
        }));
      }
      localStorage.setItem(
        LOCAL_STORAGE_ORDER_LIST +
          "-" +
          deviceName +
          "-" +
          deviceDetails.vid +
          "-" +
          deviceDetails.pid,
        JSON.stringify(deviceEntries)
      );
      localStorage.setItem(
        LOCAL_STORAGE_KEY_MAPPING +
          "-" +
          deviceName +
          "-" +
          deviceDetails.vid +
          "-" +
          deviceDetails.pid,
        JSON.stringify(mappings)
      );

      let devices = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MAPPING));
      if (devices === null && Object.keys(keyMapping).length !== 0) {
        devices = {};
        // devices[deviceName] = true;
        devices[deviceName] = {
          vid: deviceDetails.vid,
          pid: deviceDetails.pid,
        };
        localStorage.setItem(
          LOCAL_STORAGE_KEY_MAPPING,
          JSON.stringify(devices)
        );
      } else if (
        devices[deviceName] === undefined &&
        Object.keys(keyMapping).length !== 0
      ) {
        // devices[deviceName] = true;
        devices[deviceName] = {
          vid: deviceDetails.vid,
          pid: deviceDetails.pid,
        };
        localStorage.setItem(
          LOCAL_STORAGE_KEY_MAPPING,
          JSON.stringify(devices)
        );
      }
      // I Hasan think this doesn't have real effect.
      // else if (
      //   devices[deviceName] !== undefined &&
      //   Object.keys(keyMapping).length === 0
      // ) {
      //   delete devices[deviceName];
      //   localStorage.setItem(
      //     LOCAL_STORAGE_KEY_MAPPING,
      //     JSON.stringify(devices)
      //   );
      // }

      // createMapping();
    }
  }
}

//initial function that will run when the device changes (or when open the popup for the first time)
//it load the stored data for that device name to the ui and update keymapping
function createMapping(connectedDevices) {
  if (connectedDevices) {
    allsupportedDevicesKeyMappings = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_ALL_DEVICES_KEY_MAPPINGS)
    );

    const userDefinedDevicesMappings = JSON.parse(
      localStorage.getItem("USER_EDITED_DEVICES_KEY_MAPPINGS")
    );
    if (userDefinedDevicesMappings) {
      allsupportedDevicesKeyMappings = userDefinedDevicesMappings;
    }

    allsupportedDevicesKeyMappings;
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
  console.log(allsupportedDevicesKeyMappings);
  for (const connectedDevice of connectedDevices) {
    const someDeviceKeyMappings = {};
    const device = `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`;
    console.log(device);
    const deviceMappingsHolderElement = document.getElementById(device);
    console.log(deviceMappingsHolderElement);
    const keyMappingList =
      deviceMappingsHolderElement.querySelectorAll(".key-mapping");
    Array.from(keyMappingList).forEach((parentDiv, index) => {
      let inputKey = parentDiv.querySelector(".input-key").value;
      let outputFields = parentDiv.querySelectorAll(".output-key");
      if (inputKey === "") return;
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
    allsupportedDevicesKeyMappings[device] = someDeviceKeyMappings;
  }

  localStorage.setItem(
    "USER_EDITED_DEVICES_KEY_MAPPINGS",
    JSON.stringify(allsupportedDevicesKeyMappings)
  );
  chrome.runtime.sendMessage({
    action: ACTIONS.UPDATE_KEY_MAPPING,
    keyMapping: allsupportedDevicesKeyMappings,
    deviceName: deviceName,
  });
  console.log(keyMapping);
}

// delete a key mapping (row)
function deleteMapping(event) {
  let parentDiv = event.target.parentNode.parentNode;
  parentDiv.remove();
  updateMapping();
}

//create output field and place it inside this
function addOutputField(parentDiv) {
  let fields = parentDiv.getElementsByClassName("output-key");
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

//add new mapping row
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
  inputKey.onkeydown = (event) => {
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

function connectDevice() {
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
    .addEventListener("click", connectDevice);
  console.log(deviceDetails);
  getDeviceName();
});
async function getDeviceName() {
  chrome.runtime.sendMessage({
    action: ACTIONS.GET_DEVICE_NAME,
  });
}

//add listeners to msgs
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup");
  console.log(message);
  if (message.action === ACTIONS.INPUT_KEY_PRESSED) {
    //background send msg that a key pressed (on the device) only if the user is inside input field
    // let focusedInput = document.activeElement;
    // if (focusedInput.classList.contains("input-key")) {
    //   focusedInput.value = message.key;
    //   updateMapping();
    // }
    console.log("Input key press deactivated");
  } else if (message.action === ACTIONS.DEVICE_CHANGED) {
    //background will send a msg containing the current device name if it changed or after a device name request
    deviceName = message.deviceName;
    console.log("device name is", deviceName);
    if (deviceName === undefined || message.connectedDevices?.length <= 0) {
      console.log("from popup action DEVICE_CHANGED, device name undefined");
      // document.getElementById("add-button").disabled = true;
      document.getElementById("device-name").innerHTML = "No device connected.";
      // document.getElementById("mapping-space").innerHTML = "";
      return;
    }
    // document.getElementById("add-button").disabled = false;
    console.log(message.deviceDetails);

    if (message?.deviceDetails) {
      document.getElementById("device-name").innerHTML = `Connected devices:`;
      deviceDetails = message.deviceDetails;
      // loadMapping();
      console.log(message.deviceDetails);
      connectedDevices = message.connectedDevices;
      createMapping(message.connectedDevices);
    }
  }
});
