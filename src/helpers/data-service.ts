// Import from "@inrupt/solid-client"
import {
    getSolidDataset,
    getFile,
    createContainerAt,
    deleteFile,
    deleteContainer,
    getContainedResourceUrlAll,
    overwriteFile,
    getSourceUrl,
    isContainer
} from "@inrupt/solid-client";
import AccessService from "./access-service";
import { Mimetype } from "./BaseDefinitions";

export default class DataService{

    public fetch;
    public verbose: boolean = false;
    public accessService: AccessService;

    constructor(fetch: any, verbose: boolean = false){
        this.fetch = fetch;
        this.verbose = verbose;
        this.accessService = new AccessService(fetch);
    }

    /**
     * FILES
     */

    // Upload File to the targetFileURL.
    // If the targetFileURL exists, overwrite the file.
    // If the targetFileURL does not exist, create the file at the location.
    public async writeFileToPod(file: File|Buffer, targetFileURL: string, makePublic: boolean = false, contentType: string) {

        var requestOptions = {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: file,
            redirect: "follow",
          };
          await this.fetch(targetFileURL, requestOptions);


        // const savedFile = await overwriteFile(
        //   targetFileURL,                            // URL for the file.
        //   file,                                     // File
        //   { contentType, fetch: this.fetch }        // mimetype if known, fetch from the authenticated session
        // );
        // this.verbose && console.log(`File saved at ${getSourceUrl(savedFile)}`);

        if(makePublic){
            await this.accessService.makeFilePublic(targetFileURL);
        }

        // return savedFile;

    }


    public async getFile(fileURL: string) {
        this.verbose && console.log(`Getting file ${fileURL}...`);
        return getFile(
            fileURL,                // File in Pod to Read
            { fetch: this.fetch }   // fetch from authenticated session
        );
    }

    public async deleteFile(fileURL: string) {
        this.verbose && console.log(`Deleting file ${fileURL}...`);
        return deleteFile(
            fileURL,                // File in Pod to Read
            { fetch: this.fetch }   // fetch from authenticated session
        );
    }

    /**
     * SPARQL
     */
    public async sparqlUpdate(fileUrl: string, query: string) {
    var requestOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/sparql-update" },
        body: query,
        redirect: "follow",
    };
    
        const response =  await this.fetch(fileUrl, requestOptions);
        return response
    }


    /**
     * CONTAINERS
     */

    public async deleteContainer(containerURL: string, includeSubContainers: boolean = true) {

        // If deleting subcontainers, we need to first get these
        if(includeSubContainers){
            // console.log(`Deleting container ${containerURL} including its subfolders...`);
            const dataset = await getSolidDataset( containerURL, { fetch: this.fetch } );
            const containerResources = await getContainedResourceUrlAll( dataset );

            // Delete resources (containers and files)
            for(let resource of containerResources){
                if(isContainer(resource)){
                    await this.deleteContainer(resource, true);
                }
                else{
                    await this.deleteFile(resource);
                }
            }
        }

        // console.log(`Deleting container ${containerURL}...`);
        return deleteContainer( containerURL, { fetch: this.fetch } );
        
    }

    public async createContainer(containerURL: string, makePublic: boolean = false) {
        
        this.verbose && console.log(`Creating container ${containerURL}...`);

        const datasetWithAcl = await createContainerAt(
            containerURL,           // File in Pod to Read
            { fetch: this.fetch }   // fetch from authenticated session
        );

        if(makePublic){
            await this.accessService.makePublic(containerURL);
        }

        return datasetWithAcl;
    }

}