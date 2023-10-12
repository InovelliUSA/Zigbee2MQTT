const fz = require("zigbee-herdsman-converters/converters/fromZigbee");
const tz = require("zigbee-herdsman-converters/converters/toZigbee");
const exposes = require("zigbee-herdsman-converters/lib/exposes");
const globalStore = require("zigbee-herdsman-converters/lib/store");
const reporting = require("zigbee-herdsman-converters/lib/reporting");
const ota = require("zigbee-herdsman-converters/lib/ota");
const utils = require("zigbee-herdsman-converters/lib/utils");
const e = exposes.presets;
const ea = exposes.access;

const fanModes = { low: 2, medium: 85, high: 254, on: 255 };

const UINT8 = 32;
const BOOLEAN = 16;
const UINT16 = 33;
const INOVELLI = 0x122f;

const intToFanMode = (value) => {
  let selectedMode = "Low";

  Object.values(fanModes).forEach((mode) => {
    if (value >= mode) {
      selectedMode = Object.keys(fanModes).find(
        (key) => fanModes[key] === mode
      );
    }
  });

  return selectedMode;
};

const clickLookup = { 
    0: 'single',
    1: 'release',
    2: 'held',
    3: 'double',
    4: 'triple',
    5: 'quadruple',
    6: 'quintuple',
};
const buttonLookup = { 
    1: 'down',
    2: 'up',
    3: 'config',
};

const ledEffects = { 
    off: 0,
    solid: 1,
    fast_blink: 2,
    slow_blink: 3,
    pulse: 4,
    chase: 5,
    open_close: 6,
    small_to_big: 7,
    aurora: 8,
    slow_falling: 9,
    medium_falling: 10,
    fast_falling: 11,
    slow_rising: 12,
    medium_rising: 13,
    fast_rising: 14,
    medium_blink: 15,
    slow_chase: 16,
    fast_chase: 17,
    fast_siren: 18,
    slow_siren: 19,
    clear_effect: 255,
};

const individualLedEffects = { 
    off: 0,
    solid: 1,
    fast_blink: 2,
    slow_blink: 3,
    pulse: 4,
    chase: 5,
    falling: 6,
    rising: 7,
    aurora: 8,
    clear_effect: 255,
};

const ATTRIBUTES = {
  dimmingSpeedUpRemote: {
        ID: 1,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light dims up when controlled from the hub. ' +
      'A setting of 0 turns the light immediately on. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 25 (2.5s)',
    },
    dimmingSpeedUpLocal: {
        ID: 2,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light dims up when controlled at the switch. ' +
      'A setting of 0 turns the light immediately on. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with dimmingSpeedUpRemote setting.',
    },
    rampRateOffToOnRemote: {
        ID: 3,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light turns on when controlled from the hub. ' +
      'A setting of 0 turns the light immediately on. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with dimmingSpeedUpRemote setting.',
    },
    rampRateOffToOnLocal: {
        ID: 4,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light turns on when controlled at the switch. ' +
      'A setting of 0 turns the light immediately on. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with dimmingSpeedUpRemote setting.',
    },
    dimmingSpeedDownRemote: {
        ID: 5,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light dims down when controlled from the hub. ' +
      'A setting of 0 turns the light immediately off. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with dimmingSpeedUpRemote setting.',
    },
    dimmingSpeedDownLocal: {
        ID: 6,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light dims down when controlled at the switch. ' +
      'A setting of 0 turns the light immediately off. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with dimmingSpeedUpLocal setting.',
    },
    rampRateOnToOffRemote: {
        ID: 7,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light turns off when controlled from the hub. ' +
      'A setting of \'instant\' turns the light immediately off. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with rampRateOffToOnRemote setting.',
    },
    rampRateOnToOffLocal: {
        ID: 8,
        dataType: UINT8,
        min: 0,
        max: 127,
        description:
      'This changes the speed that the light turns off when controlled at the switch. ' +
      'A setting of \'instant\' turns the light immediately off. Increasing the value slows down the transition speed. ' +
      'Every number represents 100ms. Default = 127 - Keep in sync with rampRateOffToOnLocal setting.',
    },
  minimumLevel: {
    ID: 9,
    dataType: UINT8,
    min: 1,
    max: 253,
    description: "The minimum level that the fan can be set to.",
  },
  maximumLevel: {
    ID: 10,
    dataType: UINT8,
    min: 2,
    max: 255,
    description: "The maximum level that the fan can be set to.",
  },
  invertSwitch: {
    ID: 11,
    dataType: BOOLEAN,
    displayType: "enum",
    values: { Yes: 1, No: 0 },
    min: 0,
    max: 1,
    description:
      "Inverts the orientation of the switch." +
      " Useful when the switch is installed upside down. Essentially up becomes down and down becomes up.",
  },
  autoTimerOff: {
    ID: 12,
    min: 0,
    max: 32767,
    dataType: UINT16,
    unit: "seconds",
    values: { Disabled: 0 },
    description:
      "Automatically turns the fan off after this many seconds." +
      " When the fan is turned on a timer is started. When the timer expires, the switch is turned off. 0 = Auto off is disabled.",
  },
  defaultLevelLocal: {
    ID: 13,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "Default level for the fan when it is turned on at the switch." +
      " A setting of 0 means that the fan will return to the level that it was on before it was turned off.",
  },
  defaultLevelRemote: {
    ID: 14,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "Default level for the fan when it is turned on from the hub." +
      " A setting of 0 means that the fan will return to the level that it was on before it was turned off.",
  },
  stateAfterPowerRestored: {
    ID: 15,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "The state the fan should return to when power is restored after power failure. 0 = off, 1-100 = level, 101 = previous.",
  },
  loadLevelIndicatorTimeout: {
    ID: 17,
    dataType: UINT8,
    description:
      "Shows the level that the load is at for x number of seconds after the load is adjusted" +
      " and then returns to the Default LED state. 0 = Stay Off, 1-10 = seconds, 11 = Stay On.",
    displayType: "enum",
    values: {
      "Stay Off": 0,
      "1 Second": 1,
      "2 Seconds": 2,
      "3 Seconds": 3,
      "4 Seconds": 4,
      "5 Seconds": 5,
      "6 Seconds": 6,
      "7 Seconds": 7,
      "8 Seconds": 8,
      "9 Seconds": 9,
      "10 Seconds": 10,
      "Stay On": 11,
    },
    min: 0,
    max: 11,
  },
  switchType: {
    ID: 22,
    dataType: UINT8,
    displayType: "enum",
    values: { "Load Only": 0, Aux: 1 },
    min: 0,
    max: 2,
    description: "Set the switch configuration.",
  },
  quickStartTime: {
    ID: 22,
    dataType: UINT8,
    min: 0,
    max: 10,
    description:
      "Duration until full power output when fan tranisitions from Off to On.",
  },
  buttonDelay: {
    ID: 50,
    dataType: UINT8,
    values: {
      "0ms": 0,
      "300ms": 3,
      "400ms": 4,
      "500ms": 5,
      "600ms": 6,
      "700ms": 7,
      "800ms": 8,
      "900ms": 9,
    },
    displayType: "enum",
    min: 0,
    max: 9,
    description:
      "This will set the button press delay. 0 = no delay (Disables Button Press Events)," +
      " 1 = 100ms, 2 = 200ms, 3 = 300ms, etc. up to 900ms. Default = 500ms.",
  },
  smartBulbMode: {
        ID: 52,
        dataType: BOOLEAN,
        displayType: 'enum',
        values: {'Disabled': 0, 'Smart Fan Mode': 1},
        description:
      'For use with Smart Fans that need constant power and are controlled via commands rather than power.',
    },
  doubleTapUpToParam55: {
        ID: 53,
        dataType: BOOLEAN,
        displayType: 'enum',
        values: {'Disabled': 0, 'Enabled': 1},
        description: 'Enable or Disable setting brightness to parameter 55 on double-tap UP.',
    },
    doubleTapDownToParam56: {
        ID: 54,
        dataType: BOOLEAN,
        displayType: 'enum',
        values: {'Disabled': 0, 'Enabled': 1},
        description: 'Enable or Disable setting brightness to parameter 56 on double-tap DOWN.',
    },
    brightnessLevelForDoubleTapUp: {
        ID: 55,
        dataType: UINT8,
        min: 2,
        max: 254,
        description: 'Set this level on double-tap UP (if enabled by P53).',
    },
    brightnessLevelForDoubleTapDown: {
        ID: 56,
        dataType: UINT8,
        min: 0,
        max: 254,
        description: 'Set this level on double-tap DOWN (if enabled by P54).',
    },
  ledColorWhenOn: {
    ID: 95,
    dataType: UINT8,
    min: 0,
    max: 255,
    values: {
      Red: 0,
      Orange: 21,
      Yellow: 42,
      Green: 85,
      Cyan: 127,
      Blue: 170,
      Violet: 212,
      Pink: 234,
      White: 255,
    },
    description: "Set the color of the LED Indicator when the load is on.",
  },
  ledColorWhenOff: {
    ID: 96,
    dataType: UINT8,
    min: 0,
    max: 255,
    values: {
      Red: 0,
      Orange: 21,
      Yellow: 42,
      Green: 85,
      Cyan: 127,
      Blue: 170,
      Violet: 212,
      Pink: 234,
      White: 255,
    },
    description: "Set the color of the LED Indicator when the load is off.",
  },
  ledIntensityWhenOn: {
    ID: 97,
    dataType: UINT8,
    min: 0,
    max: 100,
    description: "Set the intensity of the LED Indicator when the load is on.",
  },
  ledIntensityWhenOff: {
    ID: 98,
    dataType: UINT8,
    min: 0,
    max: 100,
    description: "Set the intensity of the LED Indicator when the load is off.",
  },
  localProtection: {
    ID: 256,
    dataType: BOOLEAN,
    values: { Disabled: 0, Enabled: 1 },
    description: "Ability to control switch from the wall.",
    displayType: "enum",
  },
  remoteProtection: {
    ID: 257,
    dataType: BOOLEAN,
    values: { Disabled: 0, Enabled: 1 },
    readOnly: true,
    description: "Ability to control switch from the hub.",
    displayType: "enum",
  },
  outputMode: {
    ID: 258,
    min: 0,
    max: 1,
    values: { "Fan Controller": 0, "On/Off": 1 },
    dataType: BOOLEAN,
    description:
      "Use device as a speed selectable fan controller or an on/off switch.",
    displayType: "enum",
  },
  onOffLedMode: {
    ID: 259,
    min: 0,
    max: 1,
    values: { All: 0, One: 1 },
    dataType: BOOLEAN,
    description:
      "When the device is in On/Off mode, use full LED bar or just one LED.",
    displayType: "enum",
  },
  firmwareUpdateInProgressIndicator: {
    ID: 260,
    dataType: BOOLEAN,
    values: { Disabled: 0, Enabled: 1 },
    description: "Display progress on LED bar during firmware update.",
    displayType: "enum",
  },
  defaultLed1ColorWhenOn: {
    ID: 60,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed1ColorWhenOff: {
    ID: 61,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed1IntensityWhenOn: {
    ID: 62,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed1IntensityWhenOff: {
    ID: 63,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed2ColorWhenOn: {
    ID: 65,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed2ColorWhenOff: {
    ID: 66,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed2IntensityWhenOn: {
    ID: 67,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed2IntensityWhenOff: {
    ID: 68,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed3ColorWhenOn: {
    ID: 70,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed3ColorWhenOff: {
    ID: 71,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed3IntensityWhenOn: {
    ID: 72,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed3IntensityWhenOff: {
    ID: 73,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed4ColorWhenOn: {
    ID: 75,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed4ColorWhenOff: {
    ID: 76,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed4IntensityWhenOn: {
    ID: 77,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed4IntensityWhenOff: {
    ID: 78,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed5ColorWhenOn: {
    ID: 80,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed5ColorWhenOff: {
    ID: 81,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed5IntensityWhenOn: {
    ID: 82,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed5IntensityWhenOff: {
    ID: 83,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed6ColorWhenOn: {
    ID: 85,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed6ColorWhenOff: {
    ID: 86,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed6IntensityWhenOn: {
    ID: 87,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed6IntensityWhenOff: {
    ID: 88,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed7ColorWhenOn: {
    ID: 90,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed7ColorWhenOff: {
    ID: 91,
    dataType: UINT8,
    min: 0,
    max: 255,
    description:
      "0-254:This is the color of the LED strip in a hex representation. 255:Synchronization with default all LED strip color parameter.",
  },
  defaultLed7IntensityWhenOn: {
    ID: 92,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when on. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  defaultLed7IntensityWhenOff: {
    ID: 93,
    dataType: UINT8,
    min: 0,
    max: 101,
    description:
      "Intesity of LED strip when off. 101 = Syncronized with default all LED strip intensity parameter.",
  },
  doubleTapUpForFullBrightness: {
    ID: 53,
    dataType: BOOLEAN,
    min: 0,
    max: 1,
    description: "Result of a double tap on the up button.",
    values: {
      "Button Press Event Only": 0,
      "Button Press Event + Set Load to 100%": 1,
    },
  },
};

const fzLocal = {
  inovelli_vzm35sn: {
    cluster: "manuSpecificInovelliVZM31SN",
    type: ["raw", "readResponse", "commandQueryNextImageRequest"],
    convert: (model, msg, publish, options, meta) => {
      const command = msg.data[4]; // maybe 0
      if (msg.endpoint.ID == 2 && command === 0x00) {
        // Scene Event
        // # byte 1 - msg.data[6]
        // # 0 - pressed
        // # 1 - released
        // # 2 - held
        // # 3 - 2x
        // # 4 - 3x
        // # 5 - 4x
        // # 6 - 5x

        // # byte 2 - msg.data[5]
        // # 1 - down button
        // # 2 - up button
        // # 3 - config button

        const button = buttonLookup[msg.data[5]];
        const action = clickLookup[msg.data[6]];
        return { action: `${button}_${action}` };
      }
    },
  },
};

fzLocal.fan_mode = {
  cluster: "genLevelCtrl",
  type: ["attributeReport", "readResponse"],
  convert: (model, msg, publish, options, meta) => {
    if (msg.data.hasOwnProperty("currentLevel")) {
      const mode = intToFanMode(msg.data["currentLevel"] || 1);
      return {
        fan_mode: mode,
      };
    }
    if (msg.data.hasOwnProperty("currentLevel")) {
      const mode = intToFanMode(msg.data["currentLevel"] || 1);
      return {
        fan_mode: mode,
      };
    }
  },
};

fzLocal.fan_state = {
  cluster: "genOnOff",
  type: ["attributeReport", "readResponse"],
  convert: (model, msg, publish, options, meta) => {
    if (msg.data.hasOwnProperty("onOff")) {
      return { fan_state: msg.data["onOff"] === 1 ? "ON" : "OFF" };
    }
  },
};

const tzLocal = {};

tzLocal.fan_mode = {
  key: ["fan_mode"],
  convertSet: async (entity, key, value, meta) => {
    await entity.command(
      "genLevelCtrl",
      "moveToLevelWithOnOff",
      {
        level: fanModes[value],
        transtime: 0xffff,
      },
      utils.getOptions(meta.mapped, entity)
    );

    meta.state[key] = value;

    return {
      state: {
        [key]: value,
        state: "ON",
      },
    };
  },
  convertGet: async (entity, key, meta) => {
    await entity.read("genLevelCtrl", ["currentLevel"]);
  },
};

tzLocal.fan_state = {
  key: ["fan_state"],
  convertSet: async (entity, key, value, meta) => {
    const state = meta.message.hasOwnProperty("fan_state")
      ? meta.message.fan_state.toLowerCase()
      : null;
    utils.validateValue(state, ["toggle", "off", "on"]);

    await entity.command(
      "genOnOff",
      state,
      {},
      utils.getOptions(meta.mapped, entity)
    );
    if (state === "toggle") {
      const currentState =
        meta.state[
          `state${meta.endpoint_name ? `_${meta.endpoint_name}` : ""}`
        ];
      return currentState
        ? { state: { fan_state: currentState === "OFF" ? "ON" : "OFF" } }
        : {};
    } else {
      return { state: { fan_state: state.toUpperCase() } };
    }
  },
  convertGet: async (entity, key, meta) => {
    await entity.read("genOnOff", ["onOff"]);
  },
};

tzLocal.inovelli_vzw35sn_parameters = {
  key: Object.keys(ATTRIBUTES).filter((a) => !ATTRIBUTES[a].readOnly),
  convertSet: async (entity, key, value, meta) => {
    const payload = {
      [ATTRIBUTES[key].ID]: {
        value:
          ATTRIBUTES[key].displayType === "enum"
            ? ATTRIBUTES[key].values[value]
            : value,
        type: ATTRIBUTES[key].dataType,
      },
    };

    await entity.write("manuSpecificInovelliVZM31SN", payload, {
      manufacturerCode: INOVELLI,
    });

    meta.state[key] = value;

    return {
      state: {
        [key]: value,
      },
    };
  },
  convertGet: async (entity, key, meta) => {
    const value = await entity.read(
      "manuSpecificInovelliVZM31SN",
      [ATTRIBUTES[key].ID],
      {
        manufacturerCode: INOVELLI,
      }
    );

    if (ATTRIBUTES[key].displayType === "enum") {
      const valueState = Object.keys(ATTRIBUTES[key].values).find(
        (a) => ATTRIBUTES[key].values[a] === value[key]
      );
      meta.state[key] = valueState;
      return {
        state: {
          [key]: valueState,
        },
      };
    } else {
      meta.state[key] = value[key];
      return { state: { [key]: value } };
    }
  },
};

tzLocal.inovelli_vzw35sn_parameters_readOnly = {
  key: Object.keys(ATTRIBUTES).filter((a) => ATTRIBUTES[a].readOnly),
  convertGet: async (entity, key, meta) => {
    const value = await entity.read("manuSpecificInovelliVZM31SN", [key], {
      manufacturerCode: INOVELLI,
    });

    if (ATTRIBUTES[key].displayType === "enum") {
      const valueState = Object.keys(ATTRIBUTES[key].values).find(
        (a) => ATTRIBUTES[key].values[a] === value[key]
      );
      meta.state[key] = valueState;
      return {
        state: {
          [key]: valueState,
        },
      };
    } else {
      meta.state[key] = value[key];
      return { state: value };
    }
  },
  convertSet: undefined,
};

tzLocal.inovelli_led_effect = {
  key: ["led_effect"],
  convertSet: async (entity, key, values, meta) => {
    await entity.command(
      "manuSpecificInovelliVZM31SN",
      "ledEffect",
      {
        effect: ledEffects[values.effect],
        color: Math.min(Math.max(0, values.color), 255),
        level: Math.min(Math.max(0, values.level), 100),
        duration: Math.min(Math.max(0, values.duration), 255),
      },
      { disableResponse: true, disableDefaultResponse: true }
    );
    return { state: { [key]: values } };
  },
};

tzLocal.inovelli_individual_led_effect = {
  key: ["individual_led_effect"],
  convertSet: async (entity, key, values, meta) => {
    await entity.command(
      "manuSpecificInovelliVZM31SN",
      "individualLedEffect",
      {
        led: Math.min(Math.max(0, parseInt(values.led)), 7),
        effect: individualLedEffects[values.effect],
        color: Math.min(Math.max(0, values.color), 255),
        level: Math.min(Math.max(0, values.level), 100),
        duration: Math.min(Math.max(0, values.duration), 255),
      },
      { disableResponse: true, disableDefaultResponse: true }
    );
    return { state: { [key]: values } };
  },
};

const exposeList = [
  e.fan().withModes(Object.keys(fanModes)),
  exposes
    .composite("ledEffect", "ledEffect")
    .withFeature(
      exposes
        .enum("effect", ea.SET_STATE, [
          "Off",
          "Solid",
          "Chase",
          "Fast Blink",
          "Slow Blink",
          "Pulse",
          "Open/Close",
          "Small to Big",
          "Clear Effect",
        ])
        .withDescription("Animation Effect to use for the LEDs")
    )
    .withFeature(
      exposes
        .numeric("color", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(255)
        .withDescription(
          "Calculated by using a hue color circle(value/255*360) If color = 255 display white"
        )
    )
    .withFeature(
      exposes
        .numeric("level", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(100)
        .withDescription("Brightness of the LEDs")
    )
    .withFeature(
      exposes
        .numeric("duration", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(255)
        .withDescription(
          "1-60 is in seconds calculated 61-120 is in minutes calculated by(value-60) " +
            "Example a value of 65 would be 65-60 = 5 minutes - 120-254 Is in hours calculated by(value-120) " +
            "Example a value of 132 would be 132-120 would be 12 hours. - 255 Indefinitely"
        )
    ),
  exposes
    .composite("individualLedEffect", "individualLedEffect")
    .withFeature(
      exposes
        .enum("led", ea.SET_STATE, ["1", "2", "3", "4", "5", "6", "7"])
        .withDescription("Individual LED to target.")
    )
    .withFeature(
      exposes
        .enum("effect", ea.SET_STATE, [
          "Off",
          "Solid",
          "Fast Blink",
          "Slow Blink",
          "Pulse",
        ])
        .withDescription("Animation Effect to use for the LED")
    )
    .withFeature(
      exposes
        .numeric("color", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(255)
        .withDescription(
          "Calculated by using a hue color circle(value/255*360) If color = 255 display white"
        )
    )
    .withFeature(
      exposes
        .numeric("level", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(100)
        .withDescription("Brightness of the LED")
    )
    .withFeature(
      exposes
        .numeric("duration", ea.SET_STATE)
        .withValueMin(0)
        .withValueMax(255)
        .withDescription(
          "1-60 is in seconds calculated 61-120 is in minutes calculated by(value-60) " +
            "Example a value of 65 would be 65-60 = 5 minutes - 120-254 Is in hours calculated by(value-120) " +
            " Example a value of 132 would be 132-120 would be 12 hours. - 255 Indefinitely"
        )
    ),
];

// Create Expose list with Inovelli Parameters
Object.keys(ATTRIBUTES).forEach((key) => {
  if (ATTRIBUTES[key].displayType === "enum") {
    const enumE = exposes
      .enum(
        key,
        ATTRIBUTES[key].readOnly ? ea.STATE_GET : ea.ALL,
        Object.keys(ATTRIBUTES[key].values)
      )
      .withDescription(ATTRIBUTES[key].description);
    exposeList.push(enumE);
  } else if (
    ATTRIBUTES[key].displayType === "binary" ||
    ATTRIBUTES[key].displayType === "switch"
  ) {
    exposeList.push(
      exposes
        .binary(
          key,
          ATTRIBUTES[key].readOnly ? ea.STATE_GET : ea.ALL,
          ATTRIBUTES[key].values.Enabled,
          ATTRIBUTES[key].values.Disabled
        )
        .withDescription(ATTRIBUTES[key].description)
    );
  } else {
    const numeric = exposes
      .numeric(key, ATTRIBUTES[key].readOnly ? ea.STATE_GET : ea.ALL)
      .withValueMin(ATTRIBUTES[key].min)
      .withValueMax(ATTRIBUTES[key].max);

    if (ATTRIBUTES[key].values) {
      Object.keys(ATTRIBUTES[key].values).forEach((value) => {
        numeric.withPreset(value, ATTRIBUTES[key].values[value], "");
      });
    }
    if (ATTRIBUTES[key].unit) {
      numeric.withUnit(ATTRIBUTES[key].unit);
    }
    numeric.withDescription(ATTRIBUTES[key].description);
    exposeList.push(numeric);
  }
});

module.exports = [
  {
    zigbeeModel: ["VZM35-SN"],
    model: "VZM35-SN",
    vendor: "Inovelli",
    description: "Inovelli Fan Controller",
    fanStateOn: "high",
    fromZigbee: [
      fzLocal.fan_state,
      fzLocal.fan_mode,
      fzLocal.inovelli_vzm35sn,
      fzLocal.fan_mode,
    ],
    toZigbee: [
      tzLocal.fan_state,
      tzLocal.fan_mode,
      tzLocal.inovelli_led_effect,
      tzLocal.inovelli_individual_led_effect,
      tzLocal.inovelli_vzw35sn_parameters,
      tzLocal.inovelli_vzw35sn_parameters_readOnly,
    ],
    exposes: exposeList,
    ota: ota.inovelli,
    configure: async (device, coordinatorEndpoint, logger) => {
      const endpoint = device.getEndpoint(1);
      await reporting.bind(endpoint, coordinatorEndpoint, [
        "genOnOff",
        "genLevelCtrl",
      ]);
      // Bind for Button Event Reporting
      const endpoint2 = device.getEndpoint(2);
      await reporting.bind(endpoint2, coordinatorEndpoint, [
        "manuSpecificInovelliVZM31SN",
      ]);
    },
  },
];
