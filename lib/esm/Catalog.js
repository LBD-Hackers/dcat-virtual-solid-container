"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Catalog = void 0;

var _accessService = _interopRequireDefault(require("./helpers/access-service"));

var _dataService = _interopRequireDefault(require("./helpers/data-service"));

var _querySparql = require("@comunica/query-sparql");

var _vocabCommonRdf = require("@inrupt/vocab-common-rdf");

var _rdfSerialize = _interopRequireDefault(require("rdf-serialize"));

var _streamToString = _interopRequireDefault(require("stream-to-string"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const QueryEngineRecursive = require('@comunica/query-sparql-link-traversal').QueryEngine;

class Catalog {
  constructor(session, url) {
    this.session = session;
    this.fetch = session.fetch;
    this.url = url;
    this.accessService = new _accessService.default(session.fetch);
    this.dataService = new _dataService.default(session.fetch);
    this.queryEngineRecursive = new QueryEngineRecursive();
    this.queryEngine = new _querySparql.QueryEngine();
  }
  /**
   * 
   * @returns boolean: this catalog exists or not
   */


  async checkExistence() {
    const status = await this.fetch(this.url, {
      method: "HEAD"
    }).then(result => result.status);

    if (status === 200) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * @description create this dataset within the active project
   * @param makePublic initial access rights for the dataset (boolean)
   */


  async create(makePublic, triples = []) {
    let data = `
      <> a <${_vocabCommonRdf.DCAT.Catalog}>, <${_vocabCommonRdf.DCAT.Dataset}> .

    `;

    for (const triple of triples) {
      let o;

      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`;
      } else {
        o = `"${triple.object}"`;
      }

      data += `<> <${triple.predicate}> ${o} .`;
    }

    await this.dataService.writeFileToPod(Buffer.from(data), this.url, makePublic, "text/turtle");
  }

  async addMetadata(triples) {
    let query = `INSERT DATA { `;

    for (const triple of triples) {
      let o;

      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`;
      } else {
        o = `"${triple.object}"`;
      }

      query += `<${triple.subject || this.url}> <${triple.predicate}> ${o} .`;
    }

    query += `}`;
    await this.update(query);
  }

  async getContainment(as = "DCAT", recursive = false) {
    return new Promise(async (resolve, reject) => {
      let data;

      try {
        switch (as) {
          case "LDP":
            data = await this.getContainerStructure(_vocabCommonRdf.LDP.contains, recursive);
            break;

          default:
            data = await this.getContainerStructure(_vocabCommonRdf.DCAT.dataset, recursive);
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getContainerStructure(predicate = _vocabCommonRdf.DCAT.dataset, recursive = false) {
    let engine;

    if (recursive) {
      engine = this.queryEngineRecursive;
    } else {
      engine = this.queryEngine;
    }

    let queryStart;

    switch (predicate) {
      case _vocabCommonRdf.LDP.contains:
        queryStart = `CONSTRUCT {
          ?parent <${_vocabCommonRdf.LDP.contains}> ?child , ?url
        }`;
        break;

      default:
        queryStart = `CONSTRUCT {
          ?parent <${_vocabCommonRdf.DCAT.dataset}> ?child .
          ?parent <${_vocabCommonRdf.DCAT.distribution}> ?dist .
          ?dist <${_vocabCommonRdf.DCAT.downloadURL}> ?url
        }`;
    }

    const query = queryStart + `
    WHERE {
      {
        ?parent <${_vocabCommonRdf.DCAT.dataset}> ?child .
      } UNION {
        ?parent <${_vocabCommonRdf.DCAT.distribution}> ?dist .
        ?dist <${_vocabCommonRdf.DCAT.downloadURL}> ?url .
      }
    }`;
    const quadStream = await engine.queryQuads(query, {
      sources: [this.url],
      fetch: this.fetch,
      lenient: true
    });

    const textStream = _rdfSerialize.default.serialize(quadStream, {
      contentType: 'text/turtle'
    });

    const asTtl = await (0, _streamToString.default)(textStream);
    return asTtl;
  }

  async addDataset(datasetUrl) {
    let query = `INSERT DATA {<${this.url}> <${_vocabCommonRdf.DCAT.dataset}> <${datasetUrl}> .}`;
    await this.update(query);
  }

  async deleteDataset(datasetUrl) {
    const query = `DELETE {<${this.url}> <${_vocabCommonRdf.DCAT.dataset}> <${datasetUrl}> .}`;
    await this.update(query);
  }

  async addDistribution(distributionUrl, triples = []) {
    let query = `INSERT DATA {
      <${this.url}> <${_vocabCommonRdf.DCAT.distribution}> <${distributionUrl}> .
      <${distributionUrl}> <${_vocabCommonRdf.DCAT.downloadURL}> <${distributionUrl}> .`;

    for (const triple of triples) {
      let o;

      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`;
      } else {
        o = `"${triple.object}"`;
      }

      query += `<${distributionUrl}> <${triple.predicate}> ${o} .`;
    }

    query += `}`;
    await this.update(query);
  }

  async deleteDistribution(distributionUrl) {
    const query = `DELETE {
      <${this.url}> <${_vocabCommonRdf.DCAT.distribution}> <${distributionUrl}> .
      <${distributionUrl}> <${_vocabCommonRdf.DCAT.downloadURL}> <${distributionUrl}> .
  }`;
    await this.update(query);
  }
  /**
   * @description delete this catalog
   * @returns void
   */


  async delete() {
    await this.dataService.deleteFile(this.url);
    return;
  }
  /**
   * @description Update the dataset with SPARQL (dangerous - watch out!)
   * @param query The SPARQL query with which to update the dataset
   */


  async update(query) {
    await this.dataService.sparqlUpdate(this.url, query);
  }

}

exports.Catalog = Catalog;
//# sourceMappingURL=Catalog.js.map