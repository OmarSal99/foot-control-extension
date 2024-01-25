import { GamepadDriver } from "./gamepad-driver.js";

export const DEVICES_LIST = [
    Object.freeze({
      name: "gamepad",
      driver: new GamepadDriver(),
    }),
  ];