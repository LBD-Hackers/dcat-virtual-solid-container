/// <reference types="node" />
import AccessService from "./access-service";
export default class DataService {
    fetch: any;
    verbose: boolean;
    accessService: AccessService;
    constructor(fetch: any, verbose?: boolean);
    /**
     * FILES
     */
    writeFileToPod(file: File | Buffer, targetFileURL: string, makePublic: boolean, contentType: string): Promise<void>;
    getFile(fileURL: string): Promise<Blob & import("@inrupt/solid-client").WithResourceInfo & {
        internal_resourceInfo: {
            aclUrl?: string;
            contentLocation?: string;
            linkedResources: import("@inrupt/solid-client/dist/interfaces").LinkedResourceUrlAll;
            location?: string;
            permissions?: {
                user: import("@inrupt/solid-client").Access;
                public: import("@inrupt/solid-client").Access;
            };
        };
    }>;
    deleteFile(fileURL: string): Promise<void>;
    /**
     * SPARQL
     */
    sparqlUpdate(fileUrl: string, query: string): Promise<any>;
    /**
     * CONTAINERS
     */
    deleteContainer(containerURL: string, includeSubContainers?: boolean): Promise<void>;
    createContainer(containerURL: string, makePublic?: boolean): Promise<Readonly<{
        type: "Dataset";
        graphs: Readonly<Record<string, Readonly<Record<string, Readonly<{
            type: "Subject";
            url: string;
            predicates: Readonly<Record<string, Readonly<Partial<{
                literals: Readonly<Record<string, readonly string[]>>;
                langStrings: Readonly<Record<string, readonly string[]>>;
                namedNodes: readonly string[];
                blankNodes: readonly (`_:${string}` | Readonly<Record<string, Readonly<Partial<any>>>>)[];
            }>>>>;
        }>>>> & {
            default: Readonly<Record<string, Readonly<{
                type: "Subject";
                url: string;
                predicates: Readonly<Record<string, Readonly<Partial<{
                    literals: Readonly<Record<string, readonly string[]>>;
                    langStrings: Readonly<Record<string, readonly string[]>>;
                    namedNodes: readonly string[];
                    blankNodes: readonly (`_:${string}` | Readonly<Record<string, Readonly<Partial<any>>>>)[];
                }>>>>;
            }>>>;
        }>;
    }> & import("@inrupt/solid-client").WithResourceInfo & {
        internal_resourceInfo: {
            aclUrl?: string;
            contentLocation?: string;
            linkedResources: import("@inrupt/solid-client/dist/interfaces").LinkedResourceUrlAll;
            location?: string;
            permissions?: {
                user: import("@inrupt/solid-client").Access;
                public: import("@inrupt/solid-client").Access;
            };
        };
    }>;
}
//# sourceMappingURL=data-service.d.ts.map