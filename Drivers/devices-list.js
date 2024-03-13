import { GamepadDriver } from "./gamepad-driver.js";
import { TestDeviceDriver } from "./test-device-driver.js";

// make sure that no name is repeateds.
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
  ];