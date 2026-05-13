/*! Copyright 2026 Fonticons, Inc. - https://webawesome.com/license */
import {
  o,
  require_react
} from "./chunk.B32RACHV.js";
import {
  WaCombobox
} from "./chunk.DCP7EWLJ.js";
import {
  __toESM
} from "./chunk.AIIMJL75.js";

// _bundle_/src/react/combobox/index.ts
var React = __toESM(require_react(), 1);
var tagName = "wa-combobox";
var reactWrapper = o({
  tagName,
  elementClass: WaCombobox,
  react: React,
  events: {
    onWaClear: "wa-clear",
    onWaShow: "wa-show",
    onWaAfterShow: "wa-after-show",
    onWaHide: "wa-hide",
    onWaAfterHide: "wa-after-hide",
    onWaInvalid: "wa-invalid"
  },
  displayName: "WaCombobox"
});
var combobox_default = reactWrapper;

export {
  combobox_default
};
