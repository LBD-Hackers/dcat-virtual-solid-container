"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const _NAMESPACE = "https://standards.iso.org/iso/21598/-1/ed-1/en/Container#";

function _NS(localName) {
  return _NAMESPACE + localName;
}

const ICDD_C = {
  PREFIX: "container",
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: {
    "container": "https://standards.iso.org/iso/21598/-1/ed-1/en/Container#"
  },
  NS: _NS,
  ContainerDescription: _NS("ContainerDescription"),
  Document: _NS("Document"),
  containsDocument: _NS("containsDocument"),
  creationDate: _NS("creationDate"),
  filename: _NS("filename"),
  format: _NS("format"),
  modificationDate: _NS("modificationDate")
};
var _default = ICDD_C;
exports.default = _default;
//# sourceMappingURL=icdd-c.js.map