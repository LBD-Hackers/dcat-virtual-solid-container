"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResourceType = exports.Mimetype = exports.AccessRights = void 0;

class AccessRights {
  read = false;
  append = false;
  write = false;
  control = false;
}

exports.AccessRights = AccessRights;
let ResourceType;
exports.ResourceType = ResourceType;

(function (ResourceType) {
  ResourceType["FILE"] = "file";
  ResourceType["DATASET"] = "dataset";
  ResourceType["CONTAINER"] = "container";
})(ResourceType || (exports.ResourceType = ResourceType = {}));

let Mimetype;
exports.Mimetype = Mimetype;

(function (Mimetype) {
  Mimetype["NTriples"] = "application/n-triples";
  Mimetype["Turtle"] = "text/turtle";
  Mimetype["NQuads"] = "application/n-quads";
  Mimetype["Trig"] = "application/trig";
  Mimetype["SPARQLJSON"] = "application/sparql-results+json";
  Mimetype["JSONLD"] = "application/ld+json";
  Mimetype["DLOG"] = "application/x.datalog";
  Mimetype["Text"] = "text/plain";
})(Mimetype || (exports.Mimetype = Mimetype = {}));
//# sourceMappingURL=BaseDefinitions.js.map