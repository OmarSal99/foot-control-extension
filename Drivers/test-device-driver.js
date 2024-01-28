import { BaseDriver } from "./base-driver.js";

export class TestDeviceDriver extends BaseDriver {
  productId = 360;
  vendorId = 62345;
  entryHandler = (event, callbackFunction) => {
  };

  open = async (callbackFunction) => {};
}