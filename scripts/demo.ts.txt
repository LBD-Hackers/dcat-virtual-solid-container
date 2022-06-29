import { Catalog } from "../src";
import { generateSession } from "../src/helpers/functions";
import {v4} from "uuid"
import DataService from "../src/helpers/data-service";
import * as path from "path";
import * as fs from "fs"
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP, RDF } from "@inrupt/vocab-common-rdf";
import LBDS from '../src/helpers/vocab/lbds'
import AccessService from "../src/helpers/access-service";

const mime = require('mime');


const files = [
  "C:/Users/Administrator/Documents/code/lbd_docker/api/tests/artifacts/duplex.ttl",
  "C:/Users/Administrator/Documents/code/lbd_docker/api/tests/artifacts/duplex.gltf"
]

const otherStakeholder = {
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

  const stakeholder = {
    webId: "http://localhost:3000/oliver/profile/card#me",
    // satellite: "https://fuseki.digitaldesigntechniques.be/dc/",
    options: {
      name: "olliToken",
      email: "olli@rwth.com",
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

async function run () {
    const session = await generateSession(stakeholder.options, stakeholder.webId)
    const dataService = new DataService(session.fetch)
    const accessService = new AccessService(session.fetch)
    const root = stakeholder.webId.replace("profile/card#me", "")

    // make project access point
    const localUrl = root + v4()

    const data = `<i> <am> <turtle> .`
    const makePublic = true
    const accessRights = {
        read: true,
        append: false,
        write: false,
        control: false,
      }

    await dataService.writeFileToPod(Buffer.from(data), localUrl, makePublic, "text/turtle")
    await accessService.setResourceAccess(localUrl, accessRights, ResourceType.FILE , otherStakeholder.webId)
}

enum ResourceType{
    FILE="file",
    DATASET="dataset",
    CONTAINER="container"
  }

const start = new Date()
run()
    .then(() => {
        const end = new Date()
        const duration = end.getTime() - start.getTime()
        console.log('duration', duration)
        process.exit(0)
    })
    .catch(err => {
        console.log('err', err)
        process.exit(1)
    })