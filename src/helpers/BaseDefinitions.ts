export interface JSONLD{
    "@context": any,
    "@graph": any[]
}

export class AccessRights{
    public read: boolean = false;
    public append: boolean = false;
    public write: boolean = false;
    public control: boolean = false;
}

export enum ResourceType{
    FILE="file",
    DATASET="dataset",
    CONTAINER="container"
}

export enum Mimetype{
    NTriples="application/n-triples",
    Turtle="text/turtle",
    NQuads="application/n-quads",
    Trig="application/trig",
    SPARQLJSON="application/sparql-results+json",
    JSONLD="application/ld+json",
    DLOG="application/x.datalog",
    Text="text/plain",
}