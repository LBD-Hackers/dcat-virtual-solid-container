const _NAMESPACE = "https://w3id.org/lbdserver#";
const PREFIX = "lbds"

function _NS (localName: string): string {
  return (_NAMESPACE + localName);
}

const LBDS = {
  PREFIX: PREFIX,
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { [PREFIX]: _NAMESPACE },
  NS: _NS,

  Aggregator: _NS("Aggregator"),
  Project: _NS("Project"), // add to ontology
  Concept: _NS("Concept"),
  StringBasedIdentifier: _NS("StringBasedIdentifier"),
  URIBasedIdentifier: _NS("URIBasedIdentifier"),

  hasReference: _NS("hasReference"),
  inDataset: _NS("inDataset"),
  inDistribution: _NS("inDistribution"),
  hasIdentifier: _NS("hasIdentifier"),
  value: _NS("value"),


  aggregates: _NS("aggregates"),
  hasProjectRegistry: _NS("hasProjectRegistry"),
  hasDatasetRegistry: _NS("hasDatasetRegistry"),
  hasReferenceRegistry: _NS("hasReferenceRegistry"),
  hasServiceRegistry: _NS("hasServiceRegistry"),
  hasSatellite: _NS("hasSatellite"),

  ProjectInvite: _NS("ProjectInvite") // add to ontology
}

export default LBDS;