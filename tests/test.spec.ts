import { Catalog } from "../src";
import { Session } from "@inrupt/solid-client-authn-node";
import * as path from "path";
import { createReadStream, readFileSync } from "fs";
import * as FileAPI from "file-api";
import { loginCredentials } from "../credentials";

import {
  getPublicAccess,
  getSolidDatasetWithAcl,
  getAgentAccess,
} from "@inrupt/solid-client";
import {v4} from 'uuid'
import { DCAT, DCTERMS, LDP, RDF, RDFS, VOID } from "@inrupt/vocab-common-rdf";
import fs from "fs"
import { extract, generateSession } from "../src/helpers/functions"
import {QueryEngine} from '@comunica/query-sparql'
import { TokenSession } from "../src/helpers/interfaces";
import DataService from "../src/helpers/data-service";

const filePath1 = path.join(__dirname, "./artifacts/duplex.gltf");
const fileUpload1 = fs.readFileSync(filePath1)

const filePath2 = path.join(__dirname, "./artifacts/duplex.ttl");
const fileUpload2 = fs.readFileSync(filePath2)

let session: Session;
let me: string;
let projectId: string = v4()
let theOtherOne: string
let reference: string;
let cat1: Catalog
let cat2: Catalog

let url1: string;
let url2: string;
let url3: string;
let engine = new QueryEngine()

const stakeholder = {
  webId: "http://localhost:3000/jeroen/profile/card#me",
  // satellite: "https://fuseki.digitaldesigntechniques.be/dc/",
  options: {
    name: "dc_token",
    email: "jeroen.werbrouck@hotmail.com",
    password: "test123",
    idp: "http://localhost:3000",
  },
  creds: {
    "refreshToken" : "pCQkA2I8D7NKutqM6fNsZP19pgzhF99QbE_8-T4R_hc",
    "clientId"     : "uHKHrpBTm0QHqDD5Sl1e7",
    "clientSecret" : "rhytNcCbuK_mB0uxnkd4AQ1OpfgnaSL36cDA0JPMVId6AJ8xxV0fHrhzfLAVKx2y0oEqHPEtWXW5DPoKd_RWMw",
    "oidcIssuer"   : "http://localhost:3000/",
  }
}

const root = stakeholder.webId.replace("profile/card#me", "")

beforeAll(async () => {
  session = new Session()
  await session.login(stakeholder.creds)
  // session = await generateSession(stakeholder.options, stakeholder.webId)
});

describe("Auth", () => {

  test("is loggedin", () => {
    expect(session.info.isLoggedIn).toBe(true);
  });

  test("can create Catalog 1", async () => {
    url1 = root + v4()
    cat1 = new Catalog(session, url1)
    await cat1.create(true)

    const response = await session.fetch(url1)
    expect(response.status).toBe(200)
  })

  test("can create Catalog 2", async () => {
    url2 = root + v4()
    cat2 = new Catalog(session, url2)
    await cat2.create(true)

    const response = await session.fetch(url2)
    expect(response.status).toBe(200)
  })

  test("can add Catalog2 as a dataset to Catalog1", async () => {
    await cat1.addDataset(url2)
    const ok = await engine.queryBoolean(`ASK {<${url1}> <${DCAT.dataset}> <${url2}> }`, {sources: [url1], fetch: session.fetch})
    expect(ok).toBe(true)
  })

  test("can upload new File and add as distribution to catalog 2", async () => {
    const dataservice = new DataService(session.fetch)
    url3 = root + v4()
    await dataservice.writeFileToPod(fileUpload1, url3, true, "model/gltf+json")

    await cat2.addDistribution(url3)
    const ok = await engine.queryBoolean(`ASK {<${url2}> <${DCAT.distribution}> <${url3}>. }`, {sources: [url2], fetch: session.fetch})
    expect(ok).toBe(true)
  })

  test("can retrieve recursive DCAT structure of catalog 1", async() => {

    const result = await cat1.get()
    console.log('result', result)
  })

  // test("can delete catalogs", async () => {
  //   const cat1 = new Catalog(session, url1)
  //   await cat1.delete()
  //   const cat2 = new Catalog(session, url2)
  //   await cat2.delete()
  // })
})
