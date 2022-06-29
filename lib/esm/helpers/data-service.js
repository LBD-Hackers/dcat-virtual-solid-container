"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _solidClient = require("@inrupt/solid-client");

var _accessService = _interopRequireDefault(require("./access-service"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Import from "@inrupt/solid-client"
class DataService {
  verbose = false;

  constructor(fetch, verbose = false) {
    this.fetch = fetch;
    this.verbose = verbose;
    this.accessService = new _accessService.default(fetch);
  }
  /**
   * FILES
   */
  // Upload File to the targetFileURL.
  // If the targetFileURL exists, overwrite the file.
  // If the targetFileURL does not exist, create the file at the location.


  async writeFileToPod(file, targetFileURL, makePublic = false, contentType) {
    var requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": contentType
      },
      body: file,
      redirect: "follow"
    };
    await this.fetch(targetFileURL, requestOptions); // const savedFile = await overwriteFile(
    //   targetFileURL,                            // URL for the file.
    //   file,                                     // File
    //   { contentType, fetch: this.fetch }        // mimetype if known, fetch from the authenticated session
    // );
    // this.verbose && console.log(`File saved at ${getSourceUrl(savedFile)}`);

    if (makePublic) {
      await this.accessService.makeFilePublic(targetFileURL);
    } // return savedFile;

  }

  async getFile(fileURL) {
    this.verbose && console.log(`Getting file ${fileURL}...`);
    return (0, _solidClient.getFile)(fileURL, // File in Pod to Read
    {
      fetch: this.fetch
    } // fetch from authenticated session
    );
  }

  async deleteFile(fileURL) {
    this.verbose && console.log(`Deleting file ${fileURL}...`);
    return (0, _solidClient.deleteFile)(fileURL, // File in Pod to Read
    {
      fetch: this.fetch
    } // fetch from authenticated session
    );
  }
  /**
   * SPARQL
   */


  async sparqlUpdate(fileUrl, query) {
    var requestOptions = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/sparql-update"
      },
      body: query,
      redirect: "follow"
    };
    const response = await this.fetch(fileUrl, requestOptions);
    return response;
  }
  /**
   * CONTAINERS
   */


  async deleteContainer(containerURL, includeSubContainers = true) {
    // If deleting subcontainers, we need to first get these
    if (includeSubContainers) {
      // console.log(`Deleting container ${containerURL} including its subfolders...`);
      const dataset = await (0, _solidClient.getSolidDataset)(containerURL, {
        fetch: this.fetch
      });
      const containerResources = await (0, _solidClient.getContainedResourceUrlAll)(dataset); // Delete resources (containers and files)

      for (let resource of containerResources) {
        if ((0, _solidClient.isContainer)(resource)) {
          await this.deleteContainer(resource, true);
        } else {
          await this.deleteFile(resource);
        }
      }
    } // console.log(`Deleting container ${containerURL}...`);


    return (0, _solidClient.deleteContainer)(containerURL, {
      fetch: this.fetch
    });
  }

  async createContainer(containerURL, makePublic = false) {
    this.verbose && console.log(`Creating container ${containerURL}...`);
    const datasetWithAcl = await (0, _solidClient.createContainerAt)(containerURL, // File in Pod to Read
    {
      fetch: this.fetch
    } // fetch from authenticated session
    );

    if (makePublic) {
      await this.accessService.makePublic(containerURL);
    }

    return datasetWithAcl;
  }

}

exports.default = DataService;
//# sourceMappingURL=data-service.js.map