// https://github.com/Marak/colors.js

// import _colors = module("colors");
// var colors = require('colors');

declare module 'colors' {
  function colors(): void;
}

declare interface String {
// styles
  bold: string;
  italic: string;
  underline: string;
  inverse: string;
  reset: string;
  dim: string;
  hidden: string;
  strikethrough: string;

// colors
  white: string;
  grey: string;
  black: string;
  blue: string;
  cyan: string;
  green: string;
  magenta: string;
  red: string;
  yellow: string;

// background colors
  bgBlack: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  bgCyan: string;
  bgWhite: string;

// extras
  rainbow: string;
  zebra: string;
  america: string;
  trap: string;
  random: string;
}
