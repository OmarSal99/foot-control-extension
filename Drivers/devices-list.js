import { GamepadDriver } from "./gamepad-driver.js";

export const DEVICES_LIST = [
    Object.freeze({
      device: "gamepad",
      driver: new GamepadDriver(),
    }),
  ];