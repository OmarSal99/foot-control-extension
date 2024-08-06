import { DEVICES_LIST } from "../constants/devices-list.js";
import { LOCAL_STORAGE } from "../constants/local-storage-keys.js";
import devicesMappings from "../another-device-mappings.json" with { type: "json" };

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
  const setUserMadeMappings = async (userMadeMappings) => {
    const userMappings = {};
    userMappings[LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS] =
      JSON.stringify(userMadeMappings);
    await chrome.storage.local.set(userMappings);
    // localStorage.setItem(
    //   LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS,
    //   JSON.stringify(userMadeMappings)
    // );
  };

  /**
   * Gets mappings made by the user for the supported devices.
   *
   * @returns {Promise<DevicesKeysMappings>}
   */
  const getUserMadeMappings = async () => {
    const userMadeMappings = await chrome.storage.local.get(
      LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS,
    );
    if(userMadeMappings[LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS])
      return JSON.parse(userMadeMappings[LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS]);
    else 
      return null
    // return JSON.parse(
    //   localStorage.getItem(LOCAL_STORAGE.USER_EDITED_DEVICES_KEY_MAPPINGS)
    // );
  };

  /**
   * Sets main mappings for the supported devices.
   *
   * @param {DevicesKeysMappings} devicesMainKeyMappings
   */
  const setDevicesMainKeyMappings = async (devicesMainKeyMappings) => {
    console.log(devicesMainKeyMappings)
    const mainMappings = {};
    mainMappings[LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS] =
      JSON.stringify(devicesMainKeyMappings);
      console.log("mainMappings", mainMappings)
    await chrome.storage.local.set(mainMappings);
    const dd = await chrome.storage.local.get(LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS)
    console.log("ddd", JSON.parse(dd[LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS]))
    // localStorage.setItem(
    //   LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS,
    //   JSON.stringify(devicesMainKeyMappings)
    // );
  };

  /**
   * Gets main mappings for the supported devices.
   *
   * @returns {Promise<DevicesKeysMappings>}
   */
  const getDevicesMainKeyMappings = async () => {
    const mainMappings = await chrome.storage.local.get(
     LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS,
    );
    return JSON.parse(mainMappings[LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS]);
    // return JSON.parse(
    //   localStorage.getItem(LOCAL_STORAGE.DEVICES_MAIN_KEY_MAPPINGS)
    // );
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
  const loadMappings = async () => {
    let allSupportedDevicesKeyMappings = await getDevicesMainKeyMappings();
    console.log("main", allSupportedDevicesKeyMappings);
    /**
     * @type {DevicesKeysMappings}
     */
    const userDefinedDevicesKeysMappings = await getUserMadeMappings();
    console.log("user", userDefinedDevicesKeysMappings);

    if (userDefinedDevicesKeysMappings) {
      // To append the newly supported devices.
      const listOfNewSupportedDevices = [];
      Object.keys(userDefinedDevicesKeysMappings).forEach((device) => {
        if (
          !Object.keys(allSupportedDevicesKeyMappings).some(
            (oldDevice) => oldDevice == device
          )
        ) {
          listOfNewSupportedDevices.push(device);
        }
      });

      listOfNewSupportedDevices.forEach((deviceName) => {
        allSupportedDevicesKeyMappings[deviceName] =
          userDefinedDevicesKeysMappings[deviceName];
      });

      // To remove any dropped devices that were supported.
      const devicesToRemove = [];
      Object.keys(allSupportedDevicesKeyMappings).forEach(
        (oldSupportedDevice) => {
          if (
            !Object.keys(userDefinedDevicesKeysMappings).some(
              (device) => device == oldSupportedDevice
            )
          ) {
            devicesToRemove.push(oldSupportedDevice);
          }
        }
      );

      devicesToRemove.forEach((device) => {
        delete allSupportedDevicesKeyMappings[device];
      });
      allSupportedDevicesKeyMappings = userDefinedDevicesKeysMappings;
    }
    await setDevicesMainKeyMappings(allSupportedDevicesKeyMappings);
    console.log("sssssssssssssss", allSupportedDevicesKeyMappings);
    return allSupportedDevicesKeyMappings;
  };

  /**
   * Loads devices' mappings from JSON file loaded from policy admin.
   *
   * Checks what devices the admin permitted, then loads their mappings based on
   *     the extension's support for the mentioned devices.
   */
  const loadMappingsFromPolicyFile = async () => {
    // return new Promise((resolve, reject) => {
      let policyDevices = [];
      // chrome.storage.managed.get((data) => {
        // policyDevices = data.devices;
        // console.log("policyDevices", policyDevices);
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
            `${device.name}-${device.vid}-${device.pid}`
          ] = { modifiable: device.modifiable, mappings: {} };

          let index = 0;
          for (const mapping of device.mapping) {
            mappings[mapping.input] = mapping.output.map((char) => ({
              key: char,
              keycode: char.charCodeAt(0),
            }));
            allSupportedDevicesKeyMappings[
              `${device.name}-${device.vid}-${device.pid}`
            ].mappings[mapping.input] = {
              outputKeys: mappings[mapping.input],
              order: index + 1,
            };
            index++;
          }
          console.log("omaromaraor", allSupportedDevicesKeyMappings);
          // Store the loaded mappings as the devices main mappings in local storage
          await setDevicesMainKeyMappings(allSupportedDevicesKeyMappings);
        }
    //     resolve();
    //   });
    // });
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
