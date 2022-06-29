export interface JSONLD {
    "@context": any;
    "@graph": any[];
}
export declare class AccessRights {
    read: boolean;
    append: boolean;
    write: boolean;
    control: boolean;
}
export declare enum ResourceType {
    FILE = "file",
    DATASET = "dataset",
    CONTAINER = "container"
}
export declare enum Mimetype {
    NTriples = "application/n-triples",
    Turtle = "text/turtle",
    NQuads = "application/n-quads",
    Trig = "application/trig",
    SPARQLJSON = "application/sparql-results+json",
    JSONLD = "application/ld+json",
    DLOG = "application/x.datalog",
    Text = "text/plain"
}
//# sourceMappingURL=BaseDefinitions.d.ts.map