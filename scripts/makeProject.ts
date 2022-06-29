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
  const projectUrl = root + v4()
  const localUrl = root + v4()

  const accessPoint = new Catalog(session, projectUrl)

  const projectMetadata = [{
    predicate: RDF.type,
    object: LBDS.Project
  }]
  
  await accessPoint.create(true, projectMetadata)
  await accessPoint.addDataset(localUrl)

  // make local project
  const partial = new Catalog(session, localUrl)
  const partialMetadata = [{
    predicate: DCTERMS.creator,
    object: session.info.webId
  }]
  await partial.create(true, partialMetadata)

  // upload all project datasets
  for (const file of files) {
    const fileUrl = root + v4()
    const metaUrl = root + v4()
    const name = file.split('/')[file.split('/').length - 1]
    const meta = new Catalog(session, metaUrl)
    await meta.create(true, [{predicate: RDFS.label, object: name}])
    await partial.addDataset(metaUrl)

    // make reference ttl file
    const mediaType = mime.lookup(file)
    const fileBuffer = fs.readFileSync(file)
    await dataService.writeFileToPod(fileBuffer, fileUrl, true, mediaType)

    let extra = [{
      predicate: DCAT.mediaType,
      object: `https://www.iana.org/assignments/media-types/${mediaType}`
    }]
    if (mediaType === "text/turtle") {
      extra.push({predicate: RDFS.label, object: "Semantics"})
    } else if (mediaType === "model/gltf+json") {
      extra.push({predicate: RDFS.label, object: "Geometry"})
    }
    await meta.addDistribution(fileUrl, extra)
  }
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