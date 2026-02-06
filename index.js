var DymoScale = function() {
  var HID = require("node-hid");
  var deviceHandle = null;

  function log(msg) {
    console.log("[dymo-scale]", msg);
  }

  this.device = function() {
    if (deviceHandle) {
      log("Using cached device handle");
      return deviceHandle;
    }

    log("Searching for DYMO devices...");
    var devices = HID.devices().filter(function(x) {
      return x.manufacturer === "DYMO";
    });

    log("Found " + devices.length + " DYMO device(s)");

    if (devices.length === 0) {
      log("No DYMO devices found");
      return null;
    }

    try {
      log("Opening device with path: " + devices[0].path);
      deviceHandle = new HID.HID(devices[0].path);
      log("Device opened successfully");
      return deviceHandle;
    } catch (err) {
      log("FAILED to open device: " + err.message);
      deviceHandle = null;
      return null;
    }
  };

  this.read = function(callback) {
    log("Read requested");

    var device = this.device();

    if (!device) {
      log("Read failed: device offline");
      return callback(new Error("device offline"));
    }

    device.read(function(error, data) {
      if (error) {
        log("Read error: " + error.message);
        deviceHandle = null;
        return callback(error);
      }

      log("Raw HID data: " + JSON.stringify(data));

      var weight = { value: 0, unit: null };
      var raw = ((256 * data[5]) + data[4]);

      if (data[1] === 4) {
        if (data[2] === 11) {
          weight.value = parseFloat(raw / 10.0);
          weight.unit = "ounces";
        } else if (data[2] === 2) {
          weight.value = raw;
          weight.unit = "grams";
        }
      }

      log(
        "Parsed weight: " +
        weight.value +
        " " +
        (weight.unit || "(unknown unit)")
      );

      callback(null, weight);
    });
  };
};

module.exports = exports = new DymoScale();
