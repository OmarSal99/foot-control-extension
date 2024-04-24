import { BaseDriver } from "./base-driver.js";

export class TestDeviceDriver extends BaseDriver {
  productId = 36;
  vendorId = 6234;
  // productId = 0x0a1e;
  // vendorId = 0x8087;
  deviceName = "Test device";
  entryHandler = (event, callbackFunction) => {};

  open = async (callbackFunction) => {};
}
