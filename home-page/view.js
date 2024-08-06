import { loadSVG } from "../utils.js";
import { homeController } from "./controller.js";

export const homeView = (function () {
  /**
   * Updates the field of names of connected devices.
   *
   * @param {string | undefined} devicesConnected Respresents the names of the
   *     connected devices, when undefined the field will convey that no device
   *     is connected.
   */
  // const updateDevicesConnectedLabel = (devicesConnected) => {
  //   const devicesNameLabel = document.getElementById("device-name");
  //   if (devicesConnected) {
  //     devicesNameLabel.textContent = `Devices connected: ${devicesConnected}`;
  //   } else {
  //     devicesNameLabel.textContent = `No device connected`;
  //   }
  // };

  /**
   * Provides control over devices' diconnect buttons to enable/disable them.
   */
  const deviceDisconnectButton = {
    /**
     * Disables the disconnect button of the device's name passed.
     *
     * @param {string} deviceFullName Represents device's full name as
     *     [deviceName-vid-pid]
     *
     * @inner
     * @function
     */
    disable: (deviceFullName) => {
      document
        .getElementById(`${deviceFullName}-disconnect-button`)
        .setAttribute("disabled", true);
    },

    /**
     * Enables the disconnect button of the device's name passed.
     *
     * @param {string} deviceFullName Represents device's full name as
     *     [deviceName-vid-pid]
     *
     * @inner
     * @function
     */
    enable: (deviceFullName) => {
      document
        .getElementById(`${deviceFullName}-disconnect-button`)
        .removeAttribute("disabled");
    },
  };

  /**
   * Provides for functionality of enabling and disabling the test mode button
   */
  // const testModeButton = {
  //   /**
  //    * Enables the test mode button
  //    *
  //    * @inner
  //    * @function
  //    */
  //   enable: () => {
  //     document.getElementById("test-mode-button").removeAttribute("disabled");
  //   },

  //   /**
  //    * Disables the test mode button
  //    *
  //    * @inner
  //    * @function
  //    */
  //   disable: () => {
  //     document
  //       .getElementById("test-mode-button")
  //       .setAttribute("disabled", true);
  //   },
  // };
  const deleteInput = (inputDiv) => {
    if (inputDiv.previousElementSibling.className === "separator")
      inputDiv.previousElementSibling.remove();
    inputDiv.remove();
    homeController.updateMapping();
  };

  const deleteOutput = (outputEl) => {
    outputEl.remove();
    homeController.updateMapping();
  };

  const createOutput = async (value, isDisabled) => {
    const outputKeyContainer = document.createElement("div");
    outputKeyContainer.classList.add("output-key-container");
    const outputKeyElement = document.createElement("input");
    outputKeyElement.type = "text";
    outputKeyElement.value = value;
    outputKeyElement.disabled = isDisabled;
    outputKeyElement.classList.add("output-key");
    outputKeyElement.onkeydown = (event) => {
      console.log("lll", event);
      outputKeyElement.value = event.key;
      outputKeyElement.setAttribute(
        "keycode",
        event.key.match(/^[a-z0-9]$/) ? event.key.charCodeAt(0) : event.keyCode
      );
      event.preventDefault();
      homeController.updateMapping();
    };
    outputKeyContainer.appendChild(outputKeyElement);
    const deleteOutputButton = await loadSVG("./../assets/delete.svg");
    deleteOutputButton.classList.add("delete-button");
    if (isDisabled) deleteOutputButton.classList.add("svg-disabled");

    deleteOutputButton.addEventListener("click", () => {
      deleteOutput(outputKeyContainer);
    });
    outputKeyContainer.appendChild(deleteOutputButton);
    return outputKeyContainer;
  };

  const createKeyMapping = async (
    mappingDiv,
    keyMappingObj,
    deviceInputKeyToShow,
    isNewMapping,
    modifiable
  ) => {
    console.log("keyobj", keyMappingObj);
    if (isNewMapping && Object.keys(keyMappingObj).length > 0) {
      const separator = document.createElement("div");
      separator.classList.add("separator");
      mappingDiv.appendChild(separator);
    }

    const keyMapping = document.createElement("div");
    keyMapping.classList.add("key-mapping");

    const inputContainer = document.createElement("div");
    inputContainer.classList.add("input-container");

    const inputKeyLabel = document.createElement("label");
    inputKeyLabel.innerHTML = "Input";
    inputKeyLabel.classList.add("input-key-label");

    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.classList.add("input-key");
    inputElement.onkeyup = (event) => {
      console.log("immmmmkeyup");
      homeController.updateMapping();
    };
    inputElement.addEventListener("focus", function () {
      homeController.setInputInterval();
    });
    inputElement.addEventListener("blur", function () {
      homeController.clearInputInterval();
    });

    inputElement.disabled = isNewMapping ? false : modifiable ? false : true;
    // Extract device's input based on order

    console.log("deviceInputKeyToShow", deviceInputKeyToShow);
    inputElement.value = isNewMapping ? "" : deviceInputKeyToShow;

    const outputKeyLabel = document.createElement("label");
    outputKeyLabel.innerHTML = "Output";
    outputKeyLabel.classList.add("output-key-label");

    inputContainer.appendChild(inputKeyLabel);
    inputContainer.appendChild(inputElement);
    keyMapping.appendChild(inputContainer);

    const outputContainer = document.createElement("div");
    outputContainer.classList.add("output-container");
    outputContainer.appendChild(outputKeyLabel);

    // console.log(allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey]);
    // console.log(deviceInputKeyToShow);

    // Iterate over the mappings of the extracted device's input
    //     in order to show them
    if (!isNewMapping) {
      for (
        let j = 0;
        j < keyMappingObj[deviceInputKeyToShow].outputKeys.length;
        j++
      ) {
        let newOutput = await createOutput(
          keyMappingObj[deviceInputKeyToShow].outputKeys[j]["key"],
          !modifiable
        );
        // const outputKeyContainer = document.createElement("div");
        // outputKeyContainer.classList.add("output-key-container");
        // const outputKeyElement = document.createElement("input");
        // outputKeyElement.type = "text";
        // outputKeyElement.value =
        //   keyMappingObj[deviceInputKeyToShow].outputKeys[j]["key"];
        // outputKeyElement.disabled = true;
        // outputKeyElement.classList.add("output-key");
        // outputKeyContainer.appendChild(outputKeyElement);

        // const deleteOutputButton = await loadSVG("./../assets/delete.svg");
        // deleteOutputButton.classList.add("delete-button");

        // outputKeyContainer.appendChild(deleteOutputButton);
        outputContainer.appendChild(newOutput);
      }
    } else {
      let newOutput = await createOutput("", !modifiable);
      // const outputKeyContainer = document.createElement("div");
      // outputKeyContainer.classList.add("output-key-container");
      // const outputKeyElement = document.createElement("input");
      // outputKeyElement.type = "text";
      // outputKeyElement.value = "";
      // outputKeyElement.disabled = false;
      // outputKeyElement.classList.add("output-key");
      // outputKeyContainer.appendChild(outputKeyElement);

      // const deleteOutputButton = await loadSVG("./../assets/delete.svg");
      // deleteOutputButton.classList.add("delete-button");

      // outputKeyContainer.appendChild(deleteOutputButton);
      outputContainer.appendChild(newOutput);
    }

    const addOutputButton = await loadSVG("./../assets/add_icon.svg");
    addOutputButton.classList.add("add-button");
    if (!modifiable) addOutputButton.classList.add("svg-disabled");

    outputContainer.appendChild(addOutputButton);
    addOutputButton.addEventListener("click", async () => {
      if (!modifiable) return;
      let newOutput = await createOutput("", false);
      outputContainer.insertBefore(newOutput, addOutputButton);
      newOutput.firstChild.focus();
    });
    keyMapping.appendChild(outputContainer);
    const deleteInputButton = await loadSVG("./../assets/delete.svg");

    deleteInputButton.classList.add("delete-button", "delete-input-button");
    if (!modifiable) deleteInputButton.classList.add("svg-disabled");

    // deleteInputButton.setAttribute("disabled", true);
    deleteInputButton.addEventListener("click", () => deleteInput(keyMapping));
    keyMapping.appendChild(deleteInputButton);
    mappingDiv.appendChild(keyMapping);
    isNewMapping && inputElement.focus();
  };

  /**
   * Loads all mappings for all devices from local storage and shows them
   */
  const showMappings = async () => {
    const allsupportedDevicesKeyMappings =
      await homeController.loadMappingsFromLocalStorage();
    console.log("show new dev", allsupportedDevicesKeyMappings);
    /**
     * HTMLElement that will contain devices with their mappings
     * @type {HTMLElement}
     */
    const devicesSpace = document.getElementById("devices-space");

    while (devicesSpace.firstChild) {
      devicesSpace.removeChild(devicesSpace.firstChild);
    }

    if (allsupportedDevicesKeyMappings) {
      // Iterate over every device supported
      for (const someDeviceKeyMappingsKey of Object.keys(
        allsupportedDevicesKeyMappings
      )) {
        const modifiable =
          allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].modifiable;
        const arrayedDeviceDetails = someDeviceKeyMappingsKey.split("-");
        const deviceDetails = {
          name: arrayedDeviceDetails[0],
          vendorId: arrayedDeviceDetails[1],
          productId: arrayedDeviceDetails[2],
        };
        const mappingDiv = document.createElement("div");
        mappingDiv.classList.add("mapping-div");
        mappingDiv.setAttribute("id", someDeviceKeyMappingsKey);

        const deviceDivHeader = document.createElement("div");
        deviceDivHeader.setAttribute("class", "row-elements-on-sides");

        const removeDeviceButton = document.createElement("button");
        removeDeviceButton.setAttribute(
          "id",
          `${someDeviceKeyMappingsKey}-remove-device-button`
        );
        removeDeviceButton.classList.add("button-with-icon", "button-danger");
        const deleteIcon = await loadSVG("./../assets/delete.svg");
        deleteIcon.children.item(0).classList.add("secondary-button-icon");
        removeDeviceButton.innerHTML = "Remove device";
        removeDeviceButton.prepend(deleteIcon);
        // Check if the device is connected or not in order to set the disabled
        //     attribute of the disconnect button for the device
        // homeController
        //   .getConnectedDevices()
        //   .some(
        //     (connectedDevice) =>
        //       connectedDevice.deviceName == deviceDetails.name &&
        //       connectedDevice.productId == deviceDetails.productId &&
        //       connectedDevice.vendorId == deviceDetails.vendorId
        //   )
        //   ? undefined
        //   : disconnectButton.setAttribute("disabled", true);
        // disconnectButton.innerHTML = "Remove device";
        removeDeviceButton.addEventListener("click", () => {
          mappingDiv.remove();
          delete allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey];
          homeController.setUserMadeKeyMappings(
            allsupportedDevicesKeyMappings
          );
          console.log(allsupportedDevicesKeyMappings);
          homeController.disconnectDevice(someDeviceKeyMappingsKey);
          // homeController.disconnectDevice(someDeviceKeyMappingsKey);
          // disconnectButton.setAttribute("disabled", true);
        });
        removeDeviceButton.disabled = !modifiable;
        const nameContainer = document.createElement("div");
        nameContainer.classList.add("name-container");
        const deviceLogo = new Image();
        deviceLogo.src = "./../assets/keyboard.svg";
        deviceLogo.alt = deviceDetails.name;
        nameContainer.appendChild(deviceLogo);

        const nameElement = document.createElement("h2");
        nameElement.innerHTML = `${deviceDetails.name}`;
        nameContainer.appendChild(nameElement);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("header-buttons-container");
        const addInputButton = document.createElement("button");
        addInputButton.setAttribute(
          "id",
          `${someDeviceKeyMappingsKey}-add-input-button`
        );
        addInputButton.classList.add("button-with-icon", "button-secondary");
        addInputButton.addEventListener("click", () => {
          if (!modifiable) return;
          createKeyMapping(
            mappingDiv,
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].mappings,
            someDeviceKeyMappingsKey,
            true,
            true
          );
        });

        const plusIcon = await loadSVG("./../assets/plus_icon.svg");
        plusIcon.children.item(0).classList.add("secondary-button-icon");
        addInputButton.innerHTML = "Add input";
        addInputButton.prepend(plusIcon);
        addInputButton.disabled = !modifiable;
        buttonsContainer.appendChild(addInputButton);
        buttonsContainer.appendChild(removeDeviceButton);

        deviceDivHeader.appendChild(nameContainer);
        deviceDivHeader.appendChild(buttonsContainer);
        mappingDiv.appendChild(deviceDivHeader);
        if (!modifiable) {
          const notification = document.createElement("p");
          notification.innerHTML =
            "This device is managed by your organization. You cannot modify this configuration.";
          notification.classList.add("device-notification");
          mappingDiv.appendChild(notification);
        }

        // mappingDiv.appendChild(vid);
        // mappingDiv.appendChild(pid);
        if (
          Object.keys(
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].mappings
          ).length === 0
        ) {
          await createKeyMapping(mappingDiv, {}, "", true, modifiable);
          devicesSpace.appendChild(mappingDiv);
        }
        // Iterate over every device's keymappings on order to show them
        //     on UI
        for (
          let i = 0;
          i <
          Object.keys(
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].mappings
          ).length;
          i++
        ) {
          const keyMappingObj =
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].mappings;
          const deviceInputKeyToShow = Object.keys(keyMappingObj).filter(
            (deviceInputKey) => keyMappingObj[deviceInputKey].order == i + 1
          )[0];
          await createKeyMapping(
            mappingDiv,
            keyMappingObj,
            deviceInputKeyToShow,
            false,
            modifiable
          );
          if (
            i <
            Object.keys(
              allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey].mappings
            ).length -
              1
          ) {
            const separator = document.createElement("div");
            separator.classList.add("separator");
            mappingDiv.appendChild(separator);
          }
          devicesSpace.appendChild(mappingDiv);
        }
      }
    }
  };

  /**
   * Binds the button with a callback function to be executed on click event.
   *
   * @param {function(undefined):undefined} callbackFunction Thu function to
   *     be called when the button is clicked
   */
  // const deviceInputModeButtonOnClick = (callbackFunction) => {
  //   document
  //     .getElementById("test-mode-button")
  //     .addEventListener("click", callbackFunction);
  // };

  /**
   * Changes the device input mode button text content.
   */
  // const deviceInputModeButtonTextContent = {
  //   /**
  //    * Sets the text content to "Switch to test mode"
  //    */
  //   switchToTestMode: () => {
  //     document.getElementById("test-mode-button").textContent =
  //       "Switch to test mode";
  //   },
  //   /**
  //    * Sets the text content to "Switch to normal mode"
  //    */
  //   switchToNormalMode: () => {
  //     document.getElementById("test-mode-button").textContent =
  //       "Switch to normal mode";
  //   },
  // };

  /**
   * Binds the connect device button click event with the passed function.
   *
   * @param {function(undefined): undefined} callbackFunction The function to
   *     be executed when the button is clicked
   */
  const connectDeviceButtonOnClick = (callbackFunction) => {
    document
      .getElementById("connect-device-button")
      .addEventListener("click", callbackFunction);
  };

  /**
   * Binds the download JSON button click event with the passed function.
   *
   * @param {function(undefined): undefined} callbackFunction The function to
   *     be executed when the button is clicked
   */
  const downloadJSONButtonOnClick = (callbackFunction) => {
    document
      .getElementById("download-json-button")
      .addEventListener("click", callbackFunction);
  };

  /**
   * Binds the test input button click event with the passed function.
   *
   * @param {function(undefined): undefined} callbackFunction The function to
   *     be executed when the button is clicked
   */
  // const testInputButtonOnClick = (callbackFunction) => {
  //   document
  //     .getElementById("test-input-button")
  //     .addEventListener("click", callbackFunction);
  // };

  /**
   * Updates the devices mappings by checking scanning the UI of the pop up
   *
   * @returns {DevicesKeysMappings}
   */
  const retrieveMappingsFromUI = async () => {
    const allSupportedDevicesMappings =
      await homeController.getAllSupportedDevicesKeyMappings();
    console.log("conncted device", homeController.getConnectedDevices());
    for (const connectedDevice of homeController.getConnectedDevices()) {
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
      allSupportedDevicesMappings[device].mappings = someDeviceKeyMappings;
      console.log("updatedddd", allSupportedDevicesMappings);
    }
    return allSupportedDevicesMappings;
  };

  return {
    connectDeviceButtonOnClick,
    downloadJSONButtonOnClick,
    deviceDisconnectButton,
    retrieveMappingsFromUI,
    // deviceInputModeButtonOnClick,
    // deviceInputModeButtonTextContent,
    showMappings,
    // testInputButtonOnClick,
    // testModeButton,
    // updateDevicesConnectedLabel,
  };
})();
