import { FootPedalDriver } from "../Drivers/foot-pedal-driver.js";
import { GamepadDriver } from "../Drivers/gamepad-driver.js";
import { TestDeviceDriver } from "../Drivers/test-device-driver.js";

/**
 * Represents the list of devices supported by the extension.
 */
export const DEVICES_LIST = [
  Object.freeze({
    name: "gamepad",
    driver: new GamepadDriver(),
  }),
  Object.freeze({
    name: "test device",
    driver: new TestDeviceDriver(),
  }),
  Object.freeze({
    name: "Foot Pedal",
    driver: new FootPedalDriver(),
  }),
];
