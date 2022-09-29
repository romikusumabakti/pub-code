
import {
    blueFromArgb,
    greenFromArgb,
    redFromArgb,
    Theme,
  } from "@material/material-color-utilities/dist";

export const colors: Record<string, number> = {
    red: 0xfff44336,
    redAccent: 0xffff5252,
    pink: 0xffe91e63,
    pinkAccent: 0xffff4081,
    purple: 0xff9c27b0,
    purpleAccent: 0xffe040fb,
    deepPurple: 0xff673ab7,
    deepPurpleAccent: 0xff7c4dff,
    indigo: 0xff3f51b5,
    indigoAccent: 0xff536dfe,
    blue: 0xff2196f3,
    blueAccent: 0xff448aff,
    lightBlue: 0xff03a9f4,
    lightBlueAccent: 0xff40c4ff,
    cyan: 0xff00bcd4,
    cyanAccent: 0xff18ffff,
    teal: 0xff009688,
    tealAccent: 0xff64ffda,
    green: 0xff4caf50,
    greenAccent: 0xff69f0ae,
    lightGreen: 0xff8bc34a,
    lightGreenAccent: 0xffb2ff59,
    lime: 0xffcddc39,
    limeAccent: 0xffeeff41,
    yellow: 0xffffeb3b,
    yellowAccent: 0xffffff00,
    amber: 0xffffc107,
    amberAccent: 0xffffd740,
    orange: 0xffff9800,
    orangeAccent: 0xffffab40,
    deepOrange: 0xffff5722,
    deepOrangeAccent: 0xffff6e40,
    brown: 0xff795548,
    grey: 0xff9e9e9e,
    blueGrey: 0xff607d8b,
  };

export function applyTheme(
    theme: Theme,
    options?: {
      dark?: boolean;
      target?: HTMLElement;
    }
  ): void {
    var _a;
    const target =
      (options === null || options === void 0 ? void 0 : options.target) ||
      document.body;
    const isDark =
      (_a = options === null || options === void 0 ? void 0 : options.dark) !==
        null && _a !== void 0
        ? _a
        : false;
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
    for (const [key, value] of Object.entries(scheme.toJSON())) {
      const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      target.style.setProperty(
        `--md-sys-color-${token}`,
        `${redFromArgb(value)} ${greenFromArgb(value)} ${blueFromArgb(value)}`
      );
    }
  }