"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _solidClient = require("@inrupt/solid-client");

var _BaseDefinitions = require("./BaseDefinitions");

// Import from "@inrupt/solid-client"
class AccessService {
  verbose = false;

  constructor(fetch, verbose = false) {
    this.fetch = fetch;
    this.verbose = verbose;
  } // Make a resource public


  async makePublic(resourceURL) {
    // I would by default not grant the public appending rights...
    const accessRights = {
      read: true,
      append: false,
      write: false,
      control: false
    };
    return this.setResourceAccess(resourceURL, accessRights, _BaseDefinitions.ResourceType.CONTAINER);
  }

  async makeFilePublic(resourceURL) {
    const accessRights = {
      read: true,
      append: true,
      write: false,
      control: false
    };
    return this.setResourceAccess(resourceURL, accessRights, _BaseDefinitions.ResourceType.FILE);
  }

  async setResourceAccess(resourceURL, accessRights, type, userWebID) {
    // Get resource with ACL
    let resourceWithAcl;

    if (type == _BaseDefinitions.ResourceType.DATASET || type == _BaseDefinitions.ResourceType.CONTAINER) {
      resourceWithAcl = await (0, _solidClient.getSolidDatasetWithAcl)(resourceURL, {
        fetch: this.fetch
      });
    }

    if (type == _BaseDefinitions.ResourceType.FILE) {
      resourceWithAcl = await (0, _solidClient.getFileWithAcl)(resourceURL, {
        fetch: this.fetch
      });
    } // Get resource ACL


    const resourceAcl = await this.getResourceAcl(resourceWithAcl); // Update ACL access

    let updatedAcl; // If no user webID provided, set the public access

    if (!userWebID || userWebID == undefined) {
      updatedAcl = (0, _solidClient.setPublicResourceAccess)(resourceAcl, accessRights);
    } // If user webID provided, set the access for that particular user
    else {
      updatedAcl = (0, _solidClient.setAgentResourceAccess)(resourceAcl, userWebID, accessRights);
    } // Save ACL


    const newAccess = await (0, _solidClient.saveAclFor)(resourceWithAcl, updatedAcl, {
      fetch: this.fetch
    });
    this.verbose && this.logAccessInfo(accessRights, resourceURL);
    return newAccess;
  } // Obtain the SolidDataset's own ACL, if available,
  // or initialise a new one, if possible:


  async getResourceAcl(datasetWithAcl) {
    let resourceAcl;

    if (!(0, _solidClient.hasResourceAcl)(datasetWithAcl)) {
      if (!(0, _solidClient.hasAccessibleAcl)(datasetWithAcl)) {
        throw new Error("The current user does not have permission to change access rights to this Resource.");
      }

      if (!(0, _solidClient.hasFallbackAcl)(datasetWithAcl)) {
        throw new Error("The current user does not have permission to see who currently has access to this Resource."); // Alternatively, initialise a new empty ACL as follows,
        // but be aware that if you do not give someone Control access,
        // **nobody will ever be able to change Access permissions in the future**:
        // resourceAcl = createAcl(myDatasetWithAcl);
      }

      resourceAcl = (0, _solidClient.createAclFromFallbackAcl)(datasetWithAcl);
    } else {
      resourceAcl = (0, _solidClient.getResourceAcl)(datasetWithAcl);
    }

    return resourceAcl;
  }

  logAccessInfo(access, resource, agent = "") {
    if (access === null) {
      console.log("Could not load access details for this Resource.");
    } else {
      if (!agent) console.log(`${agent}'s Access:: `, JSON.stringify(access));else console.log(`Public Access:: `, JSON.stringify(access));
      console.log("...", agent, access.read ? 'CAN' : 'CANNOT', "read the Resource", resource);
      console.log("...", agent, access.append ? 'CAN' : 'CANNOT', "add data to the Resource", resource);
      console.log("...", agent, access.write ? 'CAN' : 'CANNOT', "change data in the Resource", resource);

      if ('controlRead' in access) {
        console.log("...", agent, access.controlRead ? 'CAN' : 'CANNOT', "see access to the Resource", resource);
        console.log("...", agent, access.controlWrite ? 'CAN' : 'CANNOT', "change access to the Resource", resource);
      } else {
        console.log("...", agent, access.control ? 'CAN' : 'CANNOT', "change access to the Resource", resource);
      }
    }
  }

}

exports.default = AccessService;
//# sourceMappingURL=access-service.js.map