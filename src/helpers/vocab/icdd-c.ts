const _NAMESPACE = "https://standards.iso.org/iso/21598/-1/ed-1/en/Container#";
function _NS (localName: string): string {
  return (_NAMESPACE + localName);
}

const ICDD_C = {
  PREFIX: "container",
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { "container": "https://standards.iso.org/iso/21598/-1/ed-1/en/Container#" },
  NS: _NS,

  ContainerDescription: _NS("ContainerDescription"),
  Document: _NS("Document"),

  containsDocument: _NS("containsDocument"),

  creationDate: _NS("creationDate"),
  filename: _NS("filename"),
  format: _NS("format"),
  modificationDate: _NS("modificationDate")
}

export default ICDD_C;