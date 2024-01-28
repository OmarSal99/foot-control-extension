import { GamepadDriver } from "./gamepad-driver.js";
import { TestDeviceDriver } from "./test-device-driver.js";

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