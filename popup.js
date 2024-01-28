import { ACTIONS } from "./actions.js";

const LOCAL_STORAGE_KEY_MAPPING = "foot pedal key mapping";
const LOCAL_STORAGE_ORDER_LIST = "foot pedal order list";

let keyMapping = {};
let orderList = [];

let deviceName = undefined;
let inputIntervalId = null;

function createMapping() {
  document.getElementById("mapping-space").innerHTML = "";
  let storedObjectString = localStorage.getItem(
    LOCAL_STORAGE_KEY_MAPPING + "-" + deviceName
  );
  let storedOrderList = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_ORDER_LIST + "-" + deviceName)
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
  if (deviceName !== undefined) {
    chrome.runtime.sendMessage({
      action: ACTIONS.UPDATE_KEY_MAPPING,
      keyMapping: keyMapping,
      deviceName: deviceName,
    });
  }
}

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
      keyMapping[inputKey].push({
        key: outputFields[i].value,
        keycode: outputFields[i].getAttribute("keycode"),
      });
    }
    orderList.push(inputKey);
  });
  localStorage.setItem(
    LOCAL_STORAGE_ORDER_LIST + "-" + deviceName,
    JSON.stringify(orderList)
  );
  localStorage.setItem(
    LOCAL_STORAGE_KEY_MAPPING + "-" + deviceName,
    JSON.stringify(keyMapping)
  );
  chrome.runtime.sendMessage({
    action: ACTIONS.UPDATE_KEY_MAPPING,
    keyMapping: keyMapping,
    deviceName: deviceName,
  });
  console.log(keyMapping);
}

function deleteMapping(event) {
  let parentDiv = event.target.parentNode;
  parentDiv.remove();
  updateMapping();
}

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

function setInputInterval() {
  if (inputIntervalId !== null) clearInterval(inputIntervalId);
  inputIntervalId = setInterval(() => {
    chrome.runtime.sendMessage({
      action: ACTIONS.POPUP_IN_INPUT_FIELD,
    });
  }, 100);
}

function addNewMapping() {
  let mappingDiv = document.getElementById("mapping-space");
  let newMapping = document.createElement("div");
  newMapping.classList.add("key-mapping");

  let inputKeyLabel = document.createElement("label");
  inputKeyLabel.innerHTML = "input:";
  inputKeyLabel.classList.add("input-key-label");
  let inputKey = document.createElement("input");
  inputKey.type = "text";
  inputKey.classList.add("input-key");
  inputKey.onkeydown = (event) => {
    //event.preventDefault();
    updateMapping();
  };
  inputKey.addEventListener("focus", function () {
    setInputInterval();
  });
  inputKey.addEventListener("blur", function () {
    clearInterval(inputIntervalId);
    inputIntervalId = null;
  });
  newMapping.appendChild(inputKeyLabel);
  newMapping.appendChild(inputKey);

  let outputKeyLabel = document.createElement("label");
  outputKeyLabel.innerHTML = "output:";
  outputKeyLabel.classList.add("output-key-label");
  let outputContainer = document.createElement("div");
  outputContainer.classList.add("output-container");
  let outputKey = createOutputField();
  newMapping.appendChild(outputKeyLabel);
  outputContainer.appendChild(outputKey);
  newMapping.appendChild(outputContainer);

  let addFieldButton = document.createElement("button");
  addFieldButton.innerHTML = "+";
  addFieldButton.classList.add("add-field-button");
  newMapping.appendChild(addFieldButton);

  let deleteButton = document.createElement("button");
  deleteButton.innerHTML = "X";
  deleteButton.classList.add("delete-button");
  newMapping.appendChild(deleteButton);

  mappingDiv.appendChild(newMapping);
  addFieldButton.addEventListener("click", (event) => {
    addOutputField(event.target.parentNode.querySelector(".output-container"));
  });
  deleteButton.addEventListener("click", deleteMapping);
  return newMapping;
}

function connectDevice() {
  let version = parseInt(
    /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1].match(/\d+/)[0],
    10
  );
  if (typeof version === "number" && version >= 117) {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup2.html") });
  } else {
    console("pls update chrome to use this feature!");
  }
}

window.addEventListener("load", async () => {
  document
    .getElementById("connect-device-button")
    .addEventListener("click", connectDevice);
  getDeviceName();
  document
    .getElementById("add-button")
    .addEventListener("click", addNewMapping);
  document.getElementById("add-button").disabled = true;
});

async function getDeviceName() {
  chrome.runtime.sendMessage({
    action: ACTIONS.GET_DEVICE_NAME,
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("msg recieved in popup", message);
  if (message.action == ACTIONS.INPUT_KEY_PRESSED) {
    let focusedInput = document.activeElement;
    if (focusedInput.classList.contains("input-key")) {
      focusedInput.value = message.key;
      updateMapping();
    }
  } else if (message.action == ACTIONS.DEVICE_CHANGED) {
    deviceName = message.deviceName;
    console.log("device name is", deviceName);
    if (deviceName === undefined) {
      document.getElementById("add-button").disabled = true;
      document.getElementById("device-name").innerHTML =
        "unable to load device name !";
      return;
    }
    document.getElementById("add-button").disabled = false;
    createMapping();
    document.getElementById("device-name").innerHTML = deviceName;
  }
});
