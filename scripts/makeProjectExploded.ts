import { Catalog } from "../src";
import { generateSession } from "../src/helpers/functions";
import {v4} from "uuid"
import DataService from "../src/helpers/data-service";
import * as path from "path";
import * as fs from "fs"
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP, RDF } from "@inrupt/vocab-common-rdf";
import LBDS from '../src/helpers/vocab/lbds'
import AccessService from "../src/helpers/access-service";

const modelPath = "C:/Users/Administrator/Desktop/blender/CAAD/geometry/"


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

  const accessibility = {
    [stakeholder.webId]: [],
    [otherStakeholder.webId]: [],
    "public": []
  }

async function run () {
    const session = await generateSession(stakeholder.options, stakeholder.webId)
    const dataService = new DataService(session.fetch)
    const accessService = new AccessService(session.fetch)
    const root = stakeholder.webId.replace("profile/card#me", "")

  // make project access point
  const projectUrl = root + v4()
  const localUrl = root + v4()
  const datasetRegistryUrl = root + v4()
  const referenceRegistryUrl = root + v4()
  const referenceRegistryDistributionUrl = root + v4()

  const accessPoint = new Catalog(session, projectUrl)

  const projectMetadata = [{
    predicate: RDF.type,
    object: LBDS.Project
  }]
  await accessPoint.create(true, projectMetadata)
  await accessPoint.addDataset(localUrl)
  accessibility.public.push(projectUrl)
  accessibility[otherStakeholder.webId].push(projectUrl)
  accessibility[stakeholder.webId].push(projectUrl)

  // make local project
  const partial = new Catalog(session, localUrl)

  const partialMetadata = [{
    predicate: LBDS.hasDatasetRegistry,
    object: datasetRegistryUrl
  }, {
    predicate: LBDS.hasReferenceRegistry,
    object: referenceRegistryUrl
  },{
    predicate: DCTERMS.creator,
    object: session.info.webId
  }]

  await partial.create(true, partialMetadata)
  await partial.addDataset(datasetRegistryUrl)
  await partial.addDataset(referenceRegistryUrl)
  
  accessibility.public.push(localUrl)
  accessibility[otherStakeholder.webId].push(localUrl)
  accessibility[stakeholder.webId].push(localUrl)


  // make dataset registry
  const dsReg = new Catalog(session, datasetRegistryUrl)
  await dsReg.create(true)

  // upload all project datasets

  // make reference registry
  const refReg = new Catalog(session, referenceRegistryUrl)
  await refReg.create(true)
  accessibility.public.push(referenceRegistryUrl)
  accessibility[otherStakeholder.webId].push(referenceRegistryUrl)
  accessibility[stakeholder.webId].push(referenceRegistryUrl)

  await refReg.addDataset(referenceRegistryDistributionUrl)

  // make reference ttl file
  await dataService.writeFileToPod(Buffer.from(''), referenceRegistryDistributionUrl, true, "text/turtle")
  await refReg.addDistribution(referenceRegistryDistributionUrl, [{predicate: RDFS.label, object: "test"}])
  

  accessibility.public.push(referenceRegistryDistributionUrl)
  accessibility.public.push(referenceRegistryUrl)
  accessibility[otherStakeholder.webId].push(referenceRegistryDistributionUrl)
  accessibility[otherStakeholder.webId].push(referenceRegistryUrl)
  accessibility[stakeholder.webId].push(referenceRegistryDistributionUrl)
  accessibility[stakeholder.webId].push(referenceRegistryUrl)

  const graphPath = "C:/Users/Administrator/Documents/code/LBDserver-tools/lbdserver-client-api/tests/artifacts/"
  const graphName = "chairCAAD.ttl"
  await readFileAndMakeDistribution(graphName, graphPath, root, dsReg, dataService, accessService, "text/turtle",session)

  const files = fs.readdirSync(modelPath)
  let remaining = files.length
  for (const file of files) {
    const mediaType = "model/gltf+json"

    await readFileAndMakeDistribution(file, modelPath, root, dsReg, dataService, accessService, mediaType, session)
    remaining = remaining - 1
    console.log('remaining', remaining)
  } 

  console.log('accessibility', accessibility)
  fs.writeFileSync("./scripts/logs/access.json", JSON.stringify(accessibility, undefined, 4))

}



async function readFileAndMakeDistribution(file, modelPath, root, datasetRegistry: Catalog, dataService, accessService: AccessService, mediaType, session) {
    const publicResource =  Math.random() >= 0.5

    const filePath = modelPath + file

    const url = root + v4()
    const parentUrl = root + v4()
    const parent = new Catalog(session, parentUrl)
    await parent.create(publicResource)
    await datasetRegistry.addDataset(parentUrl)

    const fileBuffer = fs.readFileSync(filePath)

    await dataService.writeFileToPod(fileBuffer, url, publicResource, mediaType)
    const distMetadata = [{
      predicate: DCAT.mediaType,
      object: `https://www.iana.org/assignments/media-types/${mediaType}`
    },
    {
      predicate: RDFS.label,
      object: file
    }]

    await parent.addDistribution(url, distMetadata)

    if (!publicResource) {
      const includeOtherStakeholder =  Math.random() >= 0.5

      const accessRights = {
        read: true,
        append: false,
        write: false,
        control: false,
      }


      if (includeOtherStakeholder) {
        await accessService.setResourceAccess(url, accessRights, ResourceType.FILE, otherStakeholder.webId)
        await accessService.setResourceAccess(parentUrl, accessRights, ResourceType.FILE, otherStakeholder.webId)
        accessibility[otherStakeholder.webId].push(url)
        accessibility[otherStakeholder.webId].push(parentUrl)
        accessibility[stakeholder.webId].push(url)
        accessibility[stakeholder.webId].push(parentUrl)
      } else {
        accessibility[stakeholder.webId].push(url)
        accessibility[stakeholder.webId].push(parentUrl)      }
    } {
      accessibility.public.push(url)
      accessibility.public.push(parentUrl)
      accessibility[otherStakeholder.webId].push(url)
      accessibility[otherStakeholder.webId].push(parentUrl)
      accessibility[stakeholder.webId].push(url)
      accessibility[stakeholder.webId].push(parentUrl)
    }
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