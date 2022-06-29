import { Catalog } from "../../src";
import { generateSession } from "../../src/helpers/functions";
import { v4 } from "uuid"
import DataService from "../../src/helpers/data-service";
import * as path from "path";
import * as fs from "fs"
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP, RDF } from "@inrupt/vocab-common-rdf";
import LBDS from '../../src/helpers/vocab/lbds'
import AccessService from "../../src/helpers/access-service";
import users from './userdata.json'
import * as mime from 'mime-types'
const dirTree = require("directory-tree");
const { readdir } = require('fs').promises;

let reiff = true
let l = 0

async function run() {
  for (const user of Object.keys(users.users)) {
    console.log(`uploading files for user ${user}`)
    const data = users.users[user]
    const session = await generateSession(data, user)

    if (!session.info.isLoggedIn) {
      console.log('session.info', session.info)
      throw Error('could not log in!')
    }
    const dataService = new DataService(session.fetch)
    const root = user.replace("profile/card#me", "")

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

    for (const filePath of data.pathsToSynchronise) {
      for await (const f of getFiles(filePath)) {
        l += 1
      }
      const tree = dirTree(filePath, { normalizePath: true })
      await iterateTree(tree, root, session, dataService, partial, [partial])
    }
    console.log("done uploading.")
    console.log("\n")
  }
}

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function iterateTree(tree, root, session, dataService: DataService, parent: Catalog, additionalParents: Catalog[] = []) {
  const datasetUrl = root + v4()
  const myDS = new Catalog(session, datasetUrl)
  const metadata = [{
    predicate: RDFS.label,
    object: tree.name
  }]
  await myDS.create(true, metadata)
  parent.addDataset(datasetUrl)

  for (const p of additionalParents) {
    p.addDataset(datasetUrl)
  }
  
  if (tree.children) { // there are still children, this is a folder
    for (const child of tree.children) {
      await iterateTree(child, root, session, dataService, myDS, additionalParents)
    }
  } else { // the end of the tree
    const distUrl = root + v4()
    const mediaType = mime.lookup(tree.path)
    const distributionMetadata = []
  
    let mt
    if (mediaType) {
      mt = mediaType
      distributionMetadata.push({
        predicate: DCAT.mediaType,
        object: `https://www.iana.org/assignments/media-types/${mediaType}`
      })
    } else {
      mt = "text/plain"
    }


    if (reiff) {
      let md = tree.name.split('[').pop()
      md = md.split(']')[0].split(" ")
      md.forEach(item => {
        const predicate = "http://purl.org/dc/terms/" + item.split('=')[0].split('.').pop()
        const object = item.split('=').pop()
        distributionMetadata.push({ predicate, object })
      })
    }

    myDS.addDistribution(distUrl, distributionMetadata)
    const fileBuffer = fs.readFileSync(tree.path)
    await dataService.writeFileToPod(fileBuffer, distUrl, true, mt)
    l -= 1
    console.log(`remaining files for ${session.info.webId}: ${l}`)
  }
}

// function aclTemplate(owner, resource) {
//   const ownerRuleId = v4()
//   const publicRuleId = v4()
//   const template =  `<#${ownerRuleId}> a <http://www.w3.org/ns/auth/acl#Authorization>;
//   <http://www.w3.org/ns/auth/acl#agent> <${owner}>;
//   <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>, <http://www.w3.org/ns/auth/acl#Write>, <http://www.w3.org/ns/auth/acl#Control>;
//   <http://www.w3.org/ns/auth/acl#accessTo> <${resource}>;
//   <http://www.w3.org/ns/auth/acl#default> <${resource}>.
// <#${publicRuleId}> a <http://www.w3.org/ns/auth/acl#Authorization>;
//   <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read>;
//   <http://www.w3.org/ns/auth/acl#accessTo> <${resource}>;
//   <http://www.w3.org/ns/auth/acl#agentClass> <http://xmlns.com/foaf/0.1/Agent>.
// `

// return template
// }

const start = new Date()
console.log('start')
run()
  .then(() => {
    const end = new Date()
    const duration = end.getTime() - start.getTime()
    console.log('duration', duration)
    process.exit(0)
  }).catch(err => {
    console.log('err', err)
    process.exit(1)
  })