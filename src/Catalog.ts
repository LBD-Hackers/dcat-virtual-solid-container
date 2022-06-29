import AccessService from "./helpers/access-service";
import DataService from "./helpers/data-service";
import { QueryEngine } from '@comunica/query-sparql'
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP } from "@inrupt/vocab-common-rdf";
import { Session as BrowserSession } from "@inrupt/solid-client-authn-browser";
import { Session as NodeSession } from "@inrupt/solid-client-authn-node";
import rdfSerializer from 'rdf-serialize';
import stringifyStream from 'stream-to-string'
import { metadata, TokenSession } from './helpers/interfaces'

const QueryEngineRecursive = require('@comunica/query-sparql-link-traversal').QueryEngine;

export class Catalog {
  public fetch;
  public accessService: AccessService;
  public dataService: DataService;
  public projectId: string;
  public url: string;
  public data: object[];
  public session: BrowserSession | NodeSession | TokenSession
  public queryEngineRecursive: any
  public queryEngine: any

  constructor(session: BrowserSession | NodeSession | TokenSession, url: string) {
    this.session = session
    this.fetch = session.fetch;
    this.url = url
    this.accessService = new AccessService(session.fetch);
    this.dataService = new DataService(session.fetch);
    this.queryEngineRecursive = new QueryEngineRecursive()
    this.queryEngine = new QueryEngine()
  }

  /**
   * 
   * @returns boolean: this catalog exists or not
   */
  public async checkExistence() {
    const status = await this.fetch(this.url, { method: "HEAD" }).then(result => result.status)
    if (status === 200) {
      return true
    } else {
      return false
    }
  }

  /**
   * @description create this dataset within the active project
   * @param makePublic initial access rights for the dataset (boolean)
   */
  public async create(makePublic, triples: metadata[] = []) {
    let data = `
      <> a <${DCAT.Catalog}>, <${DCAT.Dataset}> .

    `

    for (const triple of triples) {
      let o
      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`
      } else {
        o = `"${triple.object}"`
      }
      data += `<> <${triple.predicate}> ${o} .`
    }

    await this.dataService.writeFileToPod(Buffer.from(data), this.url, makePublic, "text/turtle")
  }

  public async addMetadata(triples: metadata[]) {
    let query = `INSERT DATA { `

    for (const triple of triples) {
      let o
      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`
      } else {
        o = `"${triple.object}"`
      }
      query += `<${triple.subject || this.url}> <${triple.predicate}> ${o} .`
    }

    query += `}`
    await this.update(query)
  }

  public async getContainment(as: string = "DCAT", recursive: boolean = false) {
    return new Promise(async (resolve, reject) => {
      let data
      try {
        switch (as) {
          case "LDP":
            data = await this.getContainerStructure(LDP.contains, recursive)
            break;
          default:
            data = await this.getContainerStructure(DCAT.dataset, recursive)
        }
        resolve(data)
      } catch (error) {
        reject(error)
      }

    })
  }

  private async getContainerStructure(predicate: string = DCAT.dataset, recursive: boolean = false) {
    let engine
    if (recursive) {
      engine = this.queryEngineRecursive
    } else {
      engine = this.queryEngine
    }

    let queryStart
    switch (predicate) {
      case LDP.contains:
        queryStart = `CONSTRUCT {
          ?parent <${LDP.contains}> ?child , ?url
        }`
        break;
      default:
        queryStart = `CONSTRUCT {
          ?parent <${DCAT.dataset}> ?child .
          ?parent <${DCAT.distribution}> ?dist .
          ?dist <${DCAT.downloadURL}> ?url
        }`
    }

    const query = queryStart + `
    WHERE {
      {
        ?parent <${DCAT.dataset}> ?child .
      } UNION {
        ?parent <${DCAT.distribution}> ?dist .
        ?dist <${DCAT.downloadURL}> ?url .
      }
    }`

    const quadStream = await engine.queryQuads(query, {
      sources: [this.url],
      fetch: this.fetch,
      lenient: true
    });

    const textStream = rdfSerializer.serialize(quadStream, { contentType: 'text/turtle' });
    const asTtl = await stringifyStream(textStream)
    return asTtl
  }

  public async addDataset(datasetUrl) {
    let query = `INSERT DATA {<${this.url}> <${DCAT.dataset}> <${datasetUrl}> .}`
    await this.update(query)
  }

  public async deleteDataset(datasetUrl) {
    const query = `DELETE {<${this.url}> <${DCAT.dataset}> <${datasetUrl}> .}`
    await this.update(query)
  }

  public async addDistribution(distributionUrl, triples: metadata[] = []) {
    let query = `INSERT DATA {
      <${this.url}> <${DCAT.distribution}> <${distributionUrl}> .
      <${distributionUrl}> <${DCAT.downloadURL}> <${distributionUrl}> .`

    for (const triple of triples) {
      let o
      if (triple.object.startsWith("http")) {
        o = `<${triple.object}>`
      } else {
        o = `"${triple.object}"`
      }
      query += `<${distributionUrl}> <${triple.predicate}> ${o} .`
    }

    query += `}`

    await this.update(query)
  }

  public async deleteDistribution(distributionUrl) {
    const query = `DELETE {
      <${this.url}> <${DCAT.distribution}> <${distributionUrl}> .
      <${distributionUrl}> <${DCAT.downloadURL}> <${distributionUrl}> .
  }`
    await this.update(query)
  }

  /**
   * @description delete this catalog
   * @returns void
   */
  public async delete() {
    await this.dataService.deleteFile(this.url)
    return
  }

  /**
   * @description Update the dataset with SPARQL (dangerous - watch out!)
   * @param query The SPARQL query with which to update the dataset
   */
  public async update(query) {
    await this.dataService.sparqlUpdate(this.url, query)
  }
}

