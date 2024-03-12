import { DEVICES_LIST } from "./Drivers/devices-list.js";
import { ACTIONS } from "./actions.js";
import devicesMappings from "./devices-mappings.json" assert { type: "json" };

const LOCAL_STORAGE_KEY_MAPPING = "foot pedal key mapping";
const LOCAL_STORAGE_ORDER_LIST = "foot pedal order list";

//dictionary that actually store the mapping, key: []
//the key (string) is the input and the array contains a list of the ouputs
let keyMapping = {};
//a list to store the order of keys from keymapping that apear in the ui
let orderList = [];

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

      createMapping();
    }
  }
}

//initial function that will run when the device changes (or when open the popup for the first time)
//it load the stored data for that device name to the ui and update keymapping
function createMapping() {
  if (deviceName !== undefined && deviceDetails !== undefined) {
    const connectedDevice = devicesMappings.filter(
      (device) =>
        device.pid == deviceDetails.pid && device.vid == deviceDetails.vid
    )[0];

    if (connectedDevice) {
      document.getElementById("mapping-space").innerHTML = "";
      let storedObjectString = localStorage.getItem(
        LOCAL_STORAGE_KEY_MAPPING +
          "-" +
          deviceName +
          "-" +
          deviceDetails.vid +
          "-" +
          deviceDetails.pid
      );
      let storedOrderList = JSON.parse(
        localStorage.getItem(
          LOCAL_STORAGE_ORDER_LIST +
            "-" +
            deviceName +
            "-" +
            deviceDetails.vid +
            "-" +
            deviceDetails.pid
        )
      );
      orderList = storedOrderList !== null ? storedOrderList : [];
      if (storedObjectString !== null) {
        keyMapping = JSON.parse(storedObjectString);
        console.log(keyMapping);
        for (let i = 0; i < orderList.length; i++) {
          if (keyMapping.hasOwnProperty(orderList[i])) {
            let outputKeys = keyMapping[orderList[i]];
            if (Array.isArray(outputKeys) && outputKeys.length === 0) continue;
            let mapping = addNewMapping();
            mapping.querySelector(".input-key").value = orderList[i];
            let outputField = mapping.querySelector(".output-key");
            outputField.value = outputKeys[0].key;
            outputField.setAttribute("keycode", outputKeys[0].keycode);
            for (let i = 1; i < outputKeys.length; i++) {
              let newOutputField = addOutputField(
                mapping.querySelector(".output-container")
              );
              newOutputField.value = outputKeys[i].key;
              newOutputField.setAttribute("keycode", outputKeys[i].keycode);
            }
          }
        }
      }
      // if (deviceName !== undefined) {
      console.log(keyMapping);
      chrome.runtime.sendMessage({
        action: ACTIONS.UPDATE_KEY_MAPPING,
        keyMapping: keyMapping,
        deviceName: deviceName,
      });
      // }
    }
  }
}

//this run every time user change something in the ui, it distroy the old keymapping and rebuild it based on the ui
//a msg indicate that the mapping update is sent with the new mapping
function updateMapping() {
  keyMapping = {};
  let mappingDiv = document.getElementById("mapping-space");
  let keyMappingList = mappingDiv.querySelectorAll(".key-mapping");
  orderList = [];
  Array.from(keyMappingList).forEach(function (parentDiv) {
    let inputKey = parentDiv.querySelector(".input-key").value;
    let outputFields = parentDiv.querySelectorAll(".output-key");
    if (inputKey in keyMapping || inputKey === "") return;
    keyMapping[inputKey] = [];
    for (let i = 0; i < outputFields.length; i++) {
      if (outputFields[i].value !== "") {
        keyMapping[inputKey].push({
          key: outputFields[i].value,
          keycode: outputFields[i].getAttribute("keycode"),
        });
      }
    }
    orderList.push(inputKey);
  });
  localStorage.setItem(
    LOCAL_STORAGE_ORDER_LIST +
      "-" +
      deviceName +
      "-" +
      deviceDetails.vid +
      "-" +
      deviceDetails.pid,
    JSON.stringify(orderList)
  );
  localStorage.setItem(
    LOCAL_STORAGE_KEY_MAPPING +
      "-" +
      deviceName +
      "-" +
      deviceDetails.vid +
      "-" +
      deviceDetails.pid,
    JSON.stringify(keyMapping)
  );
  let devices = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MAPPING));
  if (devices === null && Object.keys(keyMapping).length !== 0) {
    devices = {};
    // devices[deviceName] = true;
    devices[deviceName] = { vid: deviceDetails.vid, pid: deviceDetails.pid };
    localStorage.setItem(LOCAL_STORAGE_KEY_MAPPING, JSON.stringify(devices));
  } else if (
    devices[deviceName] === undefined &&
    Object.keys(keyMapping).length !== 0
  ) {
    // devices[deviceName] = true;
    devices[deviceName] = { vid: deviceDetails.vid, pid: deviceDetails.pid };
    localStorage.setItem(LOCAL_STORAGE_KEY_MAPPING, JSON.stringify(devices));
  } else if (
    devices[deviceName] !== undefined &&
    Object.keys(keyMapping).length === 0
  ) {
    delete devices[deviceName];
    localStorage.setItem(LOCAL_STORAGE_KEY_MAPPING, JSON.stringify(devices));
  }
  chrome.runtime.sendMessage({
    action: ACTIONS.UPDATE_KEY_MAPPING,
    keyMapping: keyMapping,
    deviceName: deviceName,
  });
  console.log(keyMapping);
}

//delete a key mapping (row)
// function deleteMapping(event) {
//   let parentDiv = event.target.parentNode;
//   parentDiv.remove();
//   updateMapping();
// }

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
  // outputKey.onkeydown = function (event) {
  //   outputKey.value = event.key;
  //   outputKey.setAttribute(
  //     "keycode",
  //     event.key.match(/^[a-z]$/) ? event.key.charCodeAt(0) : event.keyCode
  //   );
  //   event.preventDefault();
  //   updateMapping();
  // };
  return outputKey;
}

// function setInputInterval() {
//   if (inputIntervalId !== null) clearInterval(inputIntervalId);
//   inputIntervalId = setInterval(() => {
//     chrome.runtime.sendMessage({
//       action: ACTIONS.POPUP_IN_INPUT_FIELD,
//     });
//   }, 100);
// }

//add new mapping row
function addNewMapping() {
  let mappingDiv = document.getElementById("mapping-space");
  let newMapping = document.createElement("div");
  newMapping.classList.add("key-mapping", "gapped-row");

  let inputKeyLabel = document.createElement("label");
  inputKeyLabel.innerHTML = "Key:";
  inputKeyLabel.classList.add("input-key-label");
  let inputKey = document.createElement("input");
  inputKey.type = "text";
  inputKey.classList.add("input-key");
  // inputKey.onkeydown = (event) => {
  //   //event.preventDefault();
  //   updateMapping();
  // };
  inputKey.setAttribute("disabled", true);
  // inputKey.addEventListener("focus", function () {
  //   setInputInterval();
  // });
  // inputKey.addEventListener("blur", function () {
  //   clearInterval(inputIntervalId);
  //   inputIntervalId = null;
  // });

  // added by hasan - start
  const inputLabelValueWrapper = document.createElement("div");
  inputLabelValueWrapper.setAttribute("class", "label-value-pair");
  inputLabelValueWrapper.appendChild(inputKeyLabel);
  inputLabelValueWrapper.appendChild(inputKey);
  newMapping.append(inputLabelValueWrapper);
  //                - end

  // newMapping.appendChild(inputKeyLabel);
  // newMapping.appendChild(inputKey);

  let outputKeyLabel = document.createElement("label");
  outputKeyLabel.innerHTML = "Mapping:";
  outputKeyLabel.classList.add("output-key-label");
  let outputContainer = document.createElement("div");
  outputContainer.classList.add("output-container");
  let outputKey = createOutputField();

  // newMapping.appendChild(outputKeyLabel);
  // added by hasan - start

  const outputLabelValueWrapper = document.createElement("div");
  outputLabelValueWrapper.setAttribute("class", "label-value-pair");
  outputLabelValueWrapper.appendChild(outputKeyLabel);
  outputContainer.appendChild(outputKey);
  outputLabelValueWrapper.appendChild(outputContainer);
  newMapping.appendChild(outputLabelValueWrapper);
  //                -end
  // outputContainer.appendChild(outputKey);
  // newMapping.appendChild(outputContainer);

  // let addFieldButton = document.createElement("button");
  // addFieldButton.innerHTML = "+";
  // addFieldButton.classList.add("add-field-button");
  // newMapping.appendChild(addFieldButton);

  // let deleteButton = document.createElement("button");
  // deleteButton.innerHTML = "X";
  // deleteButton.classList.add("delete-button");
  // newMapping.appendChild(deleteButton);

  mappingDiv.appendChild(newMapping);
  // addFieldButton.addEventListener("click", (event) => {
  //   addOutputField(event.target.parentNode.querySelector(".output-container"));
  // });
  // deleteButton.addEventListener("click", deleteMapping);
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

  // if (deviceDetails) {
  getDeviceName();
  // loadMappings2();
  // loadMapping();
  // createMapping();
  // }

  // document
  //   .getElementById("add-button")
  //   .addEventListener("click", addNewMapping);
  // document.getElementById("add-button").disabled = true;
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
    if (deviceName === undefined) {
      console.log("from popup action DEVICE_CHANGED, device name undefined");
      // document.getElementById("add-button").disabled = true;
      document.getElementById("device-name").innerHTML = "No device connected.";
      document.getElementById("mapping-space").innerHTML = "";
      return;
    }
    // document.getElementById("add-button").disabled = false;
    console.log(message.deviceDetails);
    
    if (message?.deviceDetails) {
      document.getElementById(
        "device-name"
      ).innerHTML = `Connected device: ${deviceName}`;
      deviceDetails = message.deviceDetails;
      // loadMapping();
      console.log(message.deviceDetails);
      createMapping();
    }
  }
});
