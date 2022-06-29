// Import from "@inrupt/solid-client"
import {
    getSolidDatasetWithAcl,
    setPublicResourceAccess,
    hasResourceAcl,
    hasAccessibleAcl,
    getResourceAcl,
    createAclFromFallbackAcl,
    hasFallbackAcl,
    saveAclFor,
    setAgentResourceAccess,
    getFileWithAcl
} from "@inrupt/solid-client";
import { AccessRights, ResourceType } from "./BaseDefinitions";

export default class AccessService{

    public fetch;
    public verbose: boolean = false;

    constructor(fetch: any, verbose: boolean = false){
        this.fetch = fetch;
        this.verbose = verbose;
    }

    // Make a resource public
    public async makePublic(resourceURL: string) {
        // I would by default not grant the public appending rights...
        const accessRights: AccessRights = { read: true, append: false, write: false, control: false };
        return this.setResourceAccess(resourceURL, accessRights, ResourceType.CONTAINER);
    }

    public async makeFilePublic(resourceURL: string) {
        const accessRights: AccessRights = { read: true, append: true, write: false, control: false };
        return this.setResourceAccess(resourceURL, accessRights, ResourceType.FILE);
    }

    public async setResourceAccess(resourceURL: string, accessRights: AccessRights, type: ResourceType, userWebID?: string){

        // Get resource with ACL
        let resourceWithAcl: any
        if(type == ResourceType.DATASET || type == ResourceType.CONTAINER){
            resourceWithAcl = await getSolidDatasetWithAcl(resourceURL, {fetch: this.fetch});
        }

        if(type == ResourceType.FILE){
            resourceWithAcl = await getFileWithAcl(resourceURL, {fetch: this.fetch});
        }
        
        // Get resource ACL
        const resourceAcl = await this.getResourceAcl(resourceWithAcl);
        
        // Update ACL access
        let updatedAcl;

        // If no user webID provided, set the public access
        if(!userWebID || userWebID == undefined){
            updatedAcl = setPublicResourceAccess(
                resourceAcl,
                accessRights,
            );
        }
        
        // If user webID provided, set the access for that particular user
        else{
            updatedAcl = setAgentResourceAccess(
                resourceAcl,
                userWebID,
                accessRights,
            );
        }

        // Save ACL
        const newAccess = await saveAclFor(resourceWithAcl, updatedAcl, {fetch: this.fetch});

        this.verbose && this.logAccessInfo(accessRights, resourceURL);

        return newAccess;

    }

    // Obtain the SolidDataset's own ACL, if available,
    // or initialise a new one, if possible:
    private async getResourceAcl(datasetWithAcl: any){

        let resourceAcl;
        if (!hasResourceAcl(datasetWithAcl)) {
        if (!hasAccessibleAcl(datasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to change access rights to this Resource."
            );
        }
        if (!hasFallbackAcl(datasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to see who currently has access to this Resource."
            );
            // Alternatively, initialise a new empty ACL as follows,
            // but be aware that if you do not give someone Control access,
            // **nobody will ever be able to change Access permissions in the future**:
            // resourceAcl = createAcl(myDatasetWithAcl);
        }
            resourceAcl = createAclFromFallbackAcl(datasetWithAcl);
        } else {
            resourceAcl = getResourceAcl(datasetWithAcl);
        }

        return resourceAcl;
    }

    private logAccessInfo(access: any, resource: string, agent: string = ""){
        if (access === null) {
            console.log("Could not load access details for this Resource.");
        } else {
            if(!agent) console.log(`${agent}'s Access:: `, JSON.stringify(access));
            else console.log(`Public Access:: `, JSON.stringify(access));
            console.log("...", agent, (access.read ? 'CAN' : 'CANNOT'), "read the Resource", resource);
            console.log("...", agent, (access.append ? 'CAN' : 'CANNOT'), "add data to the Resource", resource);
            console.log("...", agent, (access.write ? 'CAN' : 'CANNOT'), "change data in the Resource", resource);

            if ('controlRead' in access){
                console.log("...", agent, (access.controlRead ? 'CAN' : 'CANNOT'), "see access to the Resource", resource);
                console.log("...", agent, (access.controlWrite ? 'CAN' : 'CANNOT'), "change access to the Resource", resource);
            }else{
                console.log("...", agent, (access.control ? 'CAN' : 'CANNOT'), "change access to the Resource", resource);
            }

        }
    }

}