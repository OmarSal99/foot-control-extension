import { FootPedalDriver } from "../Drivers/foot-pedal-driver.js";
import { GamepadDriver } from "../Drivers/gamepad-driver.js";
import { TestDeviceDriver } from "../Drivers/test-device-driver.js";

/**
 * Represents the list of devices supported by the extension.
 */
export const DEVICES_LIST = [
  Object.freeze({
    driver: new GamepadDriver(),
  }),
  Object.freeze({
    driver: new TestDeviceDriver(),
  }),
  Object.freeze({
    driver: new FootPedalDriver(),
  }),
];
