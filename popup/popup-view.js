import { popupController } from "./popup.js";

export const popupView = (function () {
  /**
   * Responsible for updating the names of the connected device within the
   *     correspoding field.
   */
  const updateConnectedDevicesNamesField = () => {
    const devicesNamesField = document.getElementById("device-name");
    if (popupController.connectedDevices.length > 0) {
      devicesNamesField.innerHTML = `Connected devices:`;
    } else {
      devicesNamesField.innerHTML = "No device connected.";
    }
  };

  /**
   * Clears the mappings shown for the devices.
   */
  const clearDevicesMappingsSpace = () => {
    document.getElementById("devices-mappings").innerHTML = "";
  };

  /**
   * Opens the extension home page when user presses on the connect button
   *     of the popup view.
   */
  const connectDeviceSelection = () => {
    //to allow background in an extension to connect and use webHID it needs to ask the user to give access to that device
    //this can only done in a tab for the extension (you can't request it from the normal popup)
    //and it require chrome version 117+

    //get chrome version
    const version = parseInt(
      /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1].match(/\d+/)[0],
      10
    );
    //if chrome version is 117+ it will open popup2 so the user can select the device
    if (typeof version === "number" && version >= 117) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("../home-page/popup2.html"),
      });
    } else {
      //inform the user that chrome need to be updated
      document.getElementById("device-name").innerHTML =
        "pls update chrome to use this feature!";
    }
  };

  /**
   * Adds new mapping row.
   *
   * @returns {HTMLElement}
   */
  const addNewMapping = () => {
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
      popupController.updateMapping();
    };
    inputKey.addEventListener("focus", function () {
      popupController.setInputInterval();
    });
    inputKey.addEventListener("blur", function () {
      clearInterval(popupController.inputIntervalId);
      popupController.inputIntervalId = null;
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
    outputLabelValueWrapper.appendChild(outputContainer);

    outputContainer.appendChild(outputKey);

    const addDeleteButtonsWrapper = document.createElement("div");
    addDeleteButtonsWrapper.setAttribute("class", "gapped-row");
    addDeleteButtonsWrapper.setAttribute("style", "margin-bottom: 10px;");

    const addFieldButton = document.createElement("button");
    addFieldButton.innerHTML = "+";
    addFieldButton.classList.add("add-field-button");

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "X";
    deleteButton.classList.add("delete-button");

    keyAndMappingHolder.appendChild(outputLabelValueWrapper);
    keyAndMappingHolder.appendChild(addFieldButton);
    keyAndMappingHolder.appendChild(deleteButton);

    newMapping.appendChild(keyAndMappingHolder);
    newMapping.appendChild(addDeleteButtonsWrapper);

    mappingDiv.appendChild(newMapping);
    addFieldButton.addEventListener("click", (event) => {
      addOutputField(
        event.target.parentNode.parentNode.querySelector(".output-container")
      );
    });
    deleteButton.addEventListener("click", deleteMapping);
    return newMapping;
  };

  /**
   * Creates and returns output box that will contain mapping
   *     of some device's input.
   *
   * @returns {HTMLElement}
   */
  const createOutputField = () => {
    const outputKey = document.createElement("input");
    outputKey.type = "text";
    outputKey.classList.add("output-key");
    outputKey.setAttribute("keycode", "");
    outputKey.onkeydown = function (event) {
      outputKey.value = event.key;
      outputKey.setAttribute(
        "keycode",
        event.key.match(/^[a-z0-9]$/) ? event.key.charCodeAt(0) : event.keyCode
      );
      event.preventDefault();
      popupController.updateMapping();
    };
    return outputKey;
  };

  /**
   * Creates and returns output field and place it inside
   *     the parent node passed.
   *
   * @param {HTMLElement} parentDiv
   *
   * @returns {HTMLElement}
   */
  const addOutputField = (parentDiv) => {
    const outputField = createOutputField();
    parentDiv.appendChild(outputField);
    return outputField;
  };

  /**
   * Deletes a key mapping row containing some device's input with its
   *  corresponding mappings, then calls for updating the mappings.
   */
  const deleteMapping = (event) => {
    const parentDiv = event.target.parentNode.parentNode;
    parentDiv.remove();
    popupController.updateMapping();
  };

  /**
   * Updates the devices mappings by checking scanning the UI of the pop up
   *
   * @returns {DevicesKeysMappings}
   */
  const retrieveMappingsFromUI = () => {
    const allSupportedDevicesMappings =
      popupController.getAllSupportedDevicesKeyMappings();
    for (const connectedDevice of popupController.connectedDevices) {
      const someDeviceKeyMappings = {};
      const device = `${connectedDevice.deviceName}-${connectedDevice.vendorId}-${connectedDevice.productId}`;
      const deviceMappingsHolderElement = document.getElementById(device);
      const keyMappingList =
        deviceMappingsHolderElement.querySelectorAll(".key-mapping");
      const inputKeys = [];
      Array.from(keyMappingList).forEach((parentDiv, index) => {
        const inputKey = parentDiv.querySelector(".input-key").value;

        if (inputKey === "" || inputKeys.includes(inputKey)) {
          parentDiv.querySelector(".input-key").value = "";
          parentDiv.remove();
          return;
        }
        inputKeys.push(inputKey);
        const outputFields = parentDiv.querySelectorAll(".output-key");
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
  };

  /**
   * Shows what device is connected and its inputs accompanied
   *     with their mappings.
   */
  const createMapping = () => {
    if (popupController.connectedDevices.length > 0) {
      const allSupportedDevicesKeyMappings =
        popupController.loadMappingsFromLocalStorage();

      if (allSupportedDevicesKeyMappings) {
        const devicesMappingsSpaceElement =
          document.getElementById("devices-mappings");
        popupController.connectedDevices.forEach((connectedDevice) => {
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
            Object.keys(allSupportedDevicesKeyMappings[deviceNameVIDPIDAsKey])
              ?.length;
            i++
          ) {
            Object.keys(
              allSupportedDevicesKeyMappings[deviceNameVIDPIDAsKey]
            ).forEach((deviceInputKey) => {
              if (
                allSupportedDevicesKeyMappings[deviceNameVIDPIDAsKey][
                  deviceInputKey
                ].order ==
                i + 1
              ) {
                const mapping = addNewMapping();
                mapping.querySelector(".input-key").value = deviceInputKey;
                const outputField = mapping.querySelector(".output-key");
                const outputKeys =
                  allSupportedDevicesKeyMappings[deviceNameVIDPIDAsKey][
                    deviceInputKey
                  ].outputKeys;
                outputField.value = outputKeys[0].key;
                outputField.setAttribute("keycode", outputKeys[0].keycode);
                for (let i = 1; i < outputKeys.length; i++) {
                  const newOutputField = addOutputField(
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
  };

  /**
   * Binds the button with a callback function to be executed on click event.
   *
   * @param {function(undefined):undefined} callbackFunction Thu function to
   *     be called when the button is clicked
   */
  const connectDeviceButtonOnClick = (callbackFunction) => {
    document
      .getElementById("connect-device-button")
      .addEventListener("click", callbackFunction);
  };

  return {
    clearDevicesMappingsSpace,
    connectDeviceSelection,
    connectDeviceButtonOnClick,
    createMapping,
    retrieveMappingsFromUI,
    updateConnectedDevicesNamesField,
  };
})();
