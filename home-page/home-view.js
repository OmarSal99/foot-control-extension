import { homeController } from "./popup2.js";

export const homeView = (function () {
  /**
   * Updates the field of names of connected devices.
   *
   * @param {string | undefined} devicesConnected Respresents the names of the
   *     connected devices, when undefined the field will convey that no device
   *     is connected.
   */
  const updateDevicesConnectedLabel = (devicesConnected) => {
    const devicesNameLabel = document.getElementById("device-name");
    if (devicesConnected) {
      devicesNameLabel.textContent = `Devices connected: ${devicesConnected}`;
    } else {
      devicesNameLabel.textContent = `No device connected`;
    }
  };

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
  const testModeButton = {
    /**
     * Enables the test mode button
     *
     * @inner
     * @function
     */
    enable: () => {
      document.getElementById("test-mode-button").removeAttribute("disabled");
    },

    /**
     * Disables the test mode button
     *
     * @inner
     * @function
     */
    disable: () => {
      document
        .getElementById("test-mode-button")
        .setAttribute("disabled", true);
    },
  };

  /**
   * Loads all mappings for all devices from local storage and shows them
   */
  const showMappings = () => {
    const allsupportedDevicesKeyMappings =
      homeController.loadMappingsFromLocalStorage();

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

        const disconnectButton = document.createElement("button");
        disconnectButton.setAttribute(
          "id",
          `${someDeviceKeyMappingsKey}-disconnect-button`
        );
        // Check if the device is connected or not in order to set the disabled
        //     attribute of the disconnect button for the device
        homeController
          .getConnectedDevices()
          .some(
            (connectedDevice) =>
              connectedDevice.deviceName == deviceDetails.name &&
              connectedDevice.productId == deviceDetails.productId &&
              connectedDevice.vendorId == deviceDetails.vendorId
          )
          ? undefined
          : disconnectButton.setAttribute("disabled", true);
        disconnectButton.innerHTML = "Disconnect";
        disconnectButton.setAttribute("style", "margin-right: 15px");
        disconnectButton.addEventListener("click", () => {
          homeController.disconnectDevice(someDeviceKeyMappingsKey);
          disconnectButton.setAttribute("disabled", true);
        });

        const nameElement = document.createElement("h2");
        nameElement.innerHTML = `Device name: ${deviceDetails.name}`;

        const vid = document.createElement("label");
        vid.innerHTML = `Vendor id:  ${deviceDetails.vendorId}`;

        const pid = document.createElement("label");
        pid.innerHTML = `Product id:  ${deviceDetails.productId}`;

        deviceDivHeader.appendChild(nameElement);
        deviceDivHeader.appendChild(disconnectButton);
        mappingDiv.appendChild(deviceDivHeader);
        mappingDiv.appendChild(vid);
        mappingDiv.appendChild(pid);

        const keyMappingsWrapper = document.createElement("div");
        keyMappingsWrapper.style.marginTop = "10px";

        // Iterate over every device's keymappings on order to show them
        //     on UI
        for (
          let i = 0;
          i <
          Object.keys(allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey])
            .length;
          i++
        ) {
          const keyMapping = document.createElement("div");
          keyMapping.classList.add("key-mapping");

          const inputKeyLabel = document.createElement("label");
          inputKeyLabel.innerHTML = "Key:";
          inputKeyLabel.classList.add("input-key-label");

          const inputElement = document.createElement("input");
          inputElement.type = "text";
          inputElement.classList.add("input-key");
          inputElement.disabled = true;
          // Extract device's input based on order
          const deviceInputKeyToShow = Object.keys(
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey]
          ).filter(
            (deviceInputKey) =>
              allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
                deviceInputKey
              ].order ==
              i + 1
          )[0];
          inputElement.value = deviceInputKeyToShow;

          const outputKeyLabel = document.createElement("label");
          outputKeyLabel.innerHTML = "Mapping:";
          outputKeyLabel.classList.add("output-key-label");

          keyMapping.appendChild(inputKeyLabel);
          keyMapping.appendChild(inputElement);
          keyMapping.appendChild(outputKeyLabel);

          const outputContainer = document.createElement("div");
          outputContainer.classList.add("output-container");
          console.log(allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey]);
          console.log(deviceInputKeyToShow);

          // Iterate over the mappings of the extracted device's input
          //     in order to show them
          for (
            let j = 0;
            j <
            allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
              deviceInputKeyToShow
            ].outputKeys.length;
            j++
          ) {
            const outputKeyElement = document.createElement("input");
            outputKeyElement.type = "text";
            outputKeyElement.value =
              allsupportedDevicesKeyMappings[someDeviceKeyMappingsKey][
                deviceInputKeyToShow
              ].outputKeys[j]["key"];
            outputKeyElement.disabled = true;
            outputKeyElement.classList.add("output-key");
            outputContainer.appendChild(outputKeyElement);
          }
          keyMapping.appendChild(outputContainer);
          keyMappingsWrapper.append(keyMapping);
          mappingDiv.appendChild(keyMapping);
        }
        mappingDiv.appendChild(keyMappingsWrapper);
        devicesSpace.appendChild(mappingDiv);
      }
    }
  };

  /**
   * Binds the button with a callback function to be executed on click event.
   *
   * @param {function(undefined):undefined} callbackFunction Thu function to
   *     be called when the button is clicked
   */
  const deviceInputModeButtonOnClick = (callbackFunction) => {
    document
      .getElementById("test-mode-button")
      .addEventListener("click", callbackFunction);
  };

  /**
   * Changes the device input mode button text content.
   */
  const deviceInputModeButtonTextContent = {
    /**
     * Sets the text content to "Switch to test mode"
     */
    switchToTestMode: () => {
      document.getElementById("test-mode-button").textContent =
        "Switch to test mode";
    },
    /**
     * Sets the text content to "Switch to normal mode"
     */
    switchToNormalMode: () => {
      document.getElementById("test-mode-button").textContent =
        "Switch to normal mode";
    },
  };

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
   * Binds the test input button click event with the passed function.
   *
   * @param {function(undefined): undefined} callbackFunction The function to
   *     be executed when the button is clicked
   */
  const testInputButtonOnClick = (callbackFunction) => {
    document
      .getElementById("test-input-button")
      .addEventListener("click", callbackFunction);
  };

  return {
    connectDeviceButtonOnClick,
    deviceDisconnectButton,
    deviceInputModeButtonOnClick,
    deviceInputModeButtonTextContent,
    showMappings,
    testInputButtonOnClick,
    testModeButton,
    updateDevicesConnectedLabel,
  };
})();
