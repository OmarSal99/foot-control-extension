import { DEVICES_LIST } from "../constants/devices-list.js";
import { LOCAL_STORAGE } from "../constants/local-storage-keys.js";
import devicesMappings from "../another-device-mappings.json" assert { type: "json" };

export const devicesWithMappingsModel = (function () {
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
   * Sets mappings made by the user for the supported devices.
   *
   * @param {DevicesKeysMappings} userMadeMappings
   */
  const setUserMadeMappings = (userMadeMappings) => {
    localStorage.setItem(
      LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS,
      JSON.stringify(userMadeMappings)
    );
  };

  /**
   * Gets mappings made by the user for the supported devices.
   *
   * @returns {DevicesKeysMappings}
   */
  const getUserMadeMappings = () => {
    return JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    );
  };

  /**
   * Sets main mappings for the supported devices.
   *
   * @param {DevicesKeysMappings} devicesMainKeyMappings
   */
  const setDevicesMainKeyMappings = (devicesMainKeyMappings) => {
    localStorage.setItem(
      LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS,
      JSON.stringify(devicesMainKeyMappings)
    );
  };

  /**
   * Gets main mappings for the supported devices.
   *
   * @returns {DevicesKeysMappings}
   */
  const getDevicesMainKeyMappings = () => {
    return JSON.parse(
      localStorage.getItem(LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS)
    );
  };

  /**
   * Retrieves device mappings from local storage of both devices main mappings
   *     and the overridden mappings by user then returns the mappings by
   *     the user if found, else it returns mappings of JSON policy file.
   *
   * It also updates the
   *
   * @returns {DevicesKeysMappings}
   */
  const loadMappings = () => {
    let allSupportedDevicesKeyMappings = getDevicesMainKeyMappings();
    /**
     * @type {DevicesKeysMappings}
     */
    const userDefinedDevicesKeysMappings = getUserMadeMappings();

    if (userDefinedDevicesKeysMappings) {
      // To append the newly supported devices.
      const listOfNewSupportedDevices = [];
      Object.keys(allSupportedDevicesKeyMappings).forEach((device) => {
        if (
          !Object.keys(userDefinedDevicesKeysMappings).some(
            (oldDevice) => oldDevice == device
          )
        ) {
          listOfNewSupportedDevices.push(device);
        }
      });

      listOfNewSupportedDevices.forEach((deviceName) => {
        userDefinedDevicesKeysMappings[deviceName] =
          allSupportedDevicesKeyMappings[deviceName];
      });

      // To remove any dropped devices that were supported.
      const devicesToRemove = [];
      Object.keys(userDefinedDevicesKeysMappings).forEach(
        (oldSupportedDevice) => {
          if (
            !Object.keys(allSupportedDevicesKeyMappings).some(
              (device) => device == oldSupportedDevice
            )
          ) {
            devicesToRemove.push(oldSupportedDevice);
          }
        }
      );

      devicesToRemove.forEach((device) => {
        delete userDefinedDevicesKeysMappings[device];
      });
      allSupportedDevicesKeyMappings = userDefinedDevicesKeysMappings;
    }
    setDevicesMainKeyMappings(allSupportedDevicesKeyMappings);
    return allSupportedDevicesKeyMappings;
  };

  /**
   * Loads devices' mappings from JSON file loaded from policy admin.
   *
   * Checks what devices the admin permitted, then loads their mappings based on
   *     the extension's support for the mentioned devices.
   */
  const loadMappingsFromPolicyFile = () => {
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

    /**
     * @type {DevicesKeysMappings}
     */
    const allSupportedDevicesKeyMappings = {};

    for (const device of supportedDevices) {
      const mappings = {};
      allSupportedDevicesKeyMappings[
        `${device.deviceName}-${device.vid}-${device.pid}`
      ] = {};

      for (const [index, value] of Object.keys(device.keyMappings).entries()) {
        const key = value;
        mappings[key] = device.keyMappings[key].outputKeys.map((char) => ({
          key: char,
          keycode: char.charCodeAt(0),
        }));
        allSupportedDevicesKeyMappings[
          `${device.deviceName}-${device.vid}-${device.pid}`
        ][key] = {
          label: device.keyMappings[key].label,
          outputKeys: mappings[key],
          order: index + 1,
        };
      }

      // Store the loaded mappings as the devices main mappings in local storage
      setDevicesMainKeyMappings(allSupportedDevicesKeyMappings);
    }
  };

  return {
    getDevicesMainKeyMappings,
    getUserMadeMappings,
    loadMappings,
    loadMappingsFromPolicyFile,
    setDevicesMainKeyMappings,
    setUserMadeMappings,
  };
})();
