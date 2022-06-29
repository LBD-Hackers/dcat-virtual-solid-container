import { LBDserver } from "./src";
import { Session } from "@inrupt/solid-client-authn-node";
import * as path from "path";
import { createReadStream, readFileSync } from "fs";
import * as FileAPI from "file-api";
import { loginCredentials } from "./credentials";
import LbdService from "./src/LbdService";
import LbdProject from "./src/LbdProject";
import { AccessRights } from "./src/helpers/BaseDefinitions";
import {
  getPublicAccess,
  getSolidDatasetWithAcl,
  getAgentAccess,
} from "@inrupt/solid-client";
import {v4} from 'uuid'
import { DCTERMS, LDP, RDF, RDFS, VOID } from "@inrupt/vocab-common-rdf";
import LbdDataset from "./src/LbdDataset";
import LbdDistribution from "./src/LbdDistribution";
import fs from "fs"
import mime from "mime-types"
import LbdConcept from "./src/LbdConcept";
import LBD from "./src/helpers/vocab/lbds";
import { IQueryResultBindings, IQueryResultBoolean, newEngine } from "@comunica/actor-init-sparql";
import { extract } from "./src/helpers/functions"


const filePath1 = path.join(__dirname, "./artifacts/duplex.gltf");
const fileUpload1 = fs.readFileSync(filePath1)

const filePath2 = path.join(__dirname, "./artifacts/duplex.ttl");
const fileUpload2 = fs.readFileSync(filePath2)
// const testFile = new File(["test"], "myFile")

// const testFile = new FileAPI.File({
//     name: "abc-song.txt",   // required
//     type: "text/plain",     // optional
//     buffer: new Buffer("abcdefg,hijklmnop, qrs, tuv, double-u, x, y and z")
// });

// const testFile = new File(["foo"], "foo.txt", {
//     type: "text/plain",
// });

// See readme for how to retrieve this!

let session: Session;
let lbd: LbdService;
let me: string;
let projectId: string = v4()
let theOtherOne: string
let project: LbdProject;
let dataset1: LbdDataset;
let dataset2: LbdDataset;
let distribution1: LbdDistribution;
let distribution2: LbdDistribution;
let concept: LbdConcept;
let reference: string;

let engine = newEngine()

beforeAll(async () => {
  jest.setTimeout(600000)
  theOtherOne = "http://localhost:5000/arch/profile/card#me"
  // projectId = "8bb70cea-f694-4ce1-ba5b-f92531574ee7"
  session = new Session();
  await session.login(loginCredentials);
  if (!session.info.isLoggedIn)
    console.error(
      "Please get login credentials with npx @inrupt/generate-oidc-token before running tests!"
    );
  lbd = new LbdService(session);
  me = session.info.webId;
});

describe("Auth", () => {
  jest.setTimeout(15000)

  /////////////////////////////////////////////////////////
  ////////////////////// PREPARATION //////////////////////
  /////////////////////////////////////////////////////////
  test("is loggedin", () => {
    expect(session.info.isLoggedIn).toBe(true);
  });

  test("can create public LBD project Repository in Pod", async () => {
    const url = me.replace("/profile/card#me", "/lbd/");
    const lbdRes = await lbd.createProjectRegistry();
    const dataset = await getSolidDatasetWithAcl(url, { fetch: session.fetch });

    //check public access
    const publicAccess = await getPublicAccess(dataset);

    //check private access
    const privateAccess = await getAgentAccess(dataset, me);

    expect(lbdRes).toBe(url);
    expect(publicAccess).toMatchObject({
      read: true,
      append: false,
      write: false,
      control: false,
    });
    expect(privateAccess).toMatchObject({
      read: true,
      append: true,
      write: true,
      control: true,
    });
  });

  test("can use Pod as LBD project repository", async () => {
    const lbdRes = await lbd.validateWebId(me);
    expect(lbdRes).toBe(true);
  });

  test("can find the LBD project registry", async () => {
    const lbdRes = await lbd.getProjectRegistry(me);
    expect(typeof lbdRes).toBe("string");
  });


  /////////////////////////////////////////////////////////
  /////////////////////// PROJECTS ////////////////////////
  /////////////////////////////////////////////////////////
  
  test("can create Project in LBD project registry", async () => {
    const repo = await lbd.getProjectRegistry(me)
    project = new LbdProject(session, repo + projectId)
    await project.create(undefined, undefined, true)
    const status = await session.fetch(project.accessPoint, {method: "HEAD"}).then(res => res.status)
    expect(status).toBe(200)
  });

  test("can give stakeholder access to project", async () => {
    const repo = await lbd.getProjectRegistry(me)
    const projectUrl = repo + projectId + "/"
    await project.addStakeholder(theOtherOne)

    const dataset = await getSolidDatasetWithAcl(projectUrl, { fetch: session.fetch });
    const access = await getAgentAccess(dataset, theOtherOne);
    expect(access).toMatchObject({
        read: true,
        append: false,
        write: false,
        control: false,
      });
  })

  test("can find all projects of stakeholder", async () => {
    const endpoint = await lbd.getProjectRegistry(session.info.webId)
    const projects = await lbd.getAllProjects(endpoint)
    expect(projects.length).toBeGreaterThan(0)
  })

  // TO RUN THIS TEST, SET A PROJECT ID YOU KNOW THIS STAKEHOLDER HAS IN THEIR PROJECT REPOSITORY

  // test("can add partial project of stakeholder to project aggregator", async () => {
  //   const repo = await lbd.getProjectRegistry(me)
  //   const projectUrl = repo + projectId + "/"

  //   const project = new LbdProject(session.fetch, repo + projectId)

  //   const partial = await project.addPartialProjectByStakeholder(theOtherOne)
  //   const partials = await project.findAllPartialProjects()
  //   console.log(`partials`, partials)
  //   expect(partials).toContain(partial)
  // })

  /////////////////////////////////////////////////////////
  ///////////// DATASETS & DISTRIBUTIONS///////////////////
  /////////////////////////////////////////////////////////
  test("can add dataset to partial project", async () => {
    dataset1 = await project.addDataset({[RDFS.label]: "theLabel"}, true)
    dataset2 = await project.addDataset({[RDFS.label]: "theLabel"})
    expect(dataset1.data).not.toBe(undefined);
  })

  test("can add 20 datasets and distributions to partial project", async () => {
    const pubStatuses = ["published", "archived", "work-in-progress", "shared"]
    const labels = ["Architecture", "Heating", "Structural", "Electricity"]
    const ontologies = ["https://w3id.org/bot#", "https://w3id.org/dot#", "http://pi.pauwel.be/voc/buildingelement#"]
    for (const index of Array(20)) {
      const status = pubStatuses[Math.floor(Math.random()*pubStatuses.length)];
      const ontology1 = ontologies[Math.floor(Math.random()*ontologies.length)];
      const ontology2 = ontologies[Math.floor(Math.random()*ontologies.length)];
      const label1 = labels[Math.floor(Math.random()*labels.length)];
      const label2 = labels[Math.floor(Math.random()*labels.length)];
      const newDset = await project.addDataset({[RDFS.label]: [label1, label2], [VOID.vocabulary]: [ontology1, ontology2], [RDF.type]: "http://lbd.arch.rwth-aachen.de/bcfOWL#Topic", [DCTERMS.created]: `${new Date()}`}, true)
      newDset.addDistribution(Buffer.from(`I am the content of ${newDset.url}`))
    }
    expect(dataset1.data).not.toBe(undefined);
  })

  test("can get all datasets of a local project", async () => {
    const ds = await project.getAllDatasetUrls()
    expect(ds.length).toBeGreaterThan(0)
  })
  
  test("can add distribution to dataset", async () => {
    distribution1 = await dataset1.addDistribution(fileUpload1, "model/gltf+json", {}, undefined, true)   
    distribution2 = await dataset2.addDistribution(fileUpload2, "text/turtle", {}, undefined)   
    expect(distribution1.url).not.toBe(undefined);
  })

  test("can get content type of distribution", async () => {
    const ct1 = await distribution1.getContentType()
    expect(ct1).toBe("https://www.iana.org/assignments/media-types/model/gltf+json")
  })


  /////////////////////////////////////////////////////////
  ////////////////////// REFERENCES ///////////////////////
  /////////////////////////////////////////////////////////
  test("can create concept", async () => {
    concept = await project.addConcept()

    const q = `ASK {<${concept.aliases[0]}> a <${LBD.Concept}> .}`
    const subject = extract(project.data, project.localProject)
    const referenceRegistry = subject[LBD.hasReferenceRegistry][0]["@id"] + "data"
    const res = await engine.query(q, {sources: [referenceRegistry], fetch: session.fetch}).then((r:any) => r.booleanResult)
    engine.invalidateHttpCache()
    expect(res).toBe(true)
  })

  test("can create reference for concept", async () => {
    reference = await concept.addReference("hello", dataset1.url, distribution1.url)
    const q = `ASK {<${concept.aliases[0]}> <${LBD.hasReference}> <${reference}> .}`
    const subject = extract(project.data, project.localProject)
    const referenceRegistry = subject[LBD.hasReferenceRegistry][0]["@id"] + "data"
    const text = await session.fetch(referenceRegistry, {headers: {"Accept": "application/ld+json"}}).then(i => i.json())
    const res = await engine.query(q, {sources: [referenceRegistry], fetch: session.fetch}).then((r:any) => r.booleanResult)

    expect(res).toBe(true)
  })

  test("can retrieve reference by identifier", async () => {
    const theNewConcept = await project.getConceptByIdentifier("hello", dataset1.url)
    expect(theNewConcept.initialized).toBe(true)
  })

  // test("can align ttl and gltf", async () => {
  //   await createReferences(project, distribution2.url, distribution1.url, session)

  //   // const q = `ASK {<${concept.url}> <${LBD.hasReference}> <${reference}> .}`
  //   // console.log('q', q);
  //   // const subject = extract(project.data, project.localProject)
  //   // const referenceRegistry = subject[LBD.hasReferenceRegistry][0]["@id"]
  //   // console.log('referenceRegistry', referenceRegistry);
  //   // const res = await engine.query(q, {sources: [referenceRegistry], fetch: session.fetch}).then((r:any) => r.booleanResult)

  //   // expect(res).toBe(true)
  // })

  /////////////////////////////////////////////////////////
  /////////////////////// CLEANUP /////////////////////////
  /////////////////////////////////////////////////////////

  // test("can delete reference for concept", async () => {
  //   await concept.deleteReference(reference)

  //   const q = `ASK {<${concept.url}> <${LBD.hasReference}> <${reference}> .}`
  //   const subject = extract(project.data, project.localProject)
  //   const referenceRegistry = subject[LBD.hasReferenceRegistry][0]["@id"]
  //   const res = await engine.query(q, {sources: [referenceRegistry], fetch: session.fetch}).then((r:any) => r.booleanResult)
  //   expect(res).toBe(false)
  // })

  // test("can delete concept", async () => {
  //   await concept.delete()

  //   const q = `ASK {<${concept.url}> a <${LBD.Concept}> .}`
  //   const subject = extract(project.data, project.localProject)
  //   const referenceRegistry = subject[LBD.hasReferenceRegistry][0]["@id"]
  //   const res = await engine.query(q, {sources: [referenceRegistry], fetch: session.fetch}).then((r:any) => r.booleanResult)
  //   expect(res).toBe(false)


  // })

//   test("can delete distribution", async () => {
//     const durl = distribution.url
//     const statusBefore = await session.fetch(durl).then(res => res.status)

//     await distribution.delete()
//     const statusAfter = await session.fetch(durl).then(res => res.status)
//     expect(statusBefore).toBe(200)
//     expect(statusAfter).toBe(404)
//  })

//   test('can delete dataset', async() => {
//     const durl = dataset1.url
//     const statusBefore = await session.fetch(durl).then(res => res.status)

//     await dataset1.delete()
//     const statusAfter = await session.fetch(durl).then(res => res.status)
//     expect(statusBefore).toBe(200)
//     expect(statusAfter).toBe(404)
//   })

//   test("can delete complete project", async () => {
//     const projectUrl = project.accessPoint
//     const statusBefore = await session.fetch(projectUrl).then(res => res.status)

//     await project.delete()
//     const statusAfter = await session.fetch(projectUrl).then(res => res.status)
//     expect(statusBefore).toBe(200)
//     expect(statusAfter).toBe(404)
//   })

//   test("can delete LBD project Repository from Pod", async () => {
//     const url = me.replace("/profile/card#me", "/lbd/");
//     const statusBefore = await session.fetch(url).then(res => res.status)

//     const lbdRes = await lbd.removeProjectRegistry(url);
//     const statusAfter = await session.fetch(url).then(res => res.status)
//     expect(statusBefore).toBe(200)
//     expect(statusAfter).toBe(404)
//   });

});

async function createReferences(project: LbdProject, lbdLocation, gltfLocation, session) {
  const myEngine = newEngine();
  const gltfData = await session.fetch(gltfLocation).then(t => t.json())
  const lbdProps = await determineLBDpropsLevel(lbdLocation, session);
  for (const element of gltfData.nodes) {
    if (element.name && element.name.length > 10) {
      let q;
      if (lbdProps === 1) {
        q = `
          prefix ldp: <http://www.w3.org/ns/ldp#>
          prefix dcat: <http://www.w3.org/ns/dcat#>
          prefix schema: <http://schema.org/> 
          prefix props: <https://w3id.org/props#>
    
          select ?element 
          where 
          { ?element props:globalIdIfcRoot_attribute_simple "${element.name}" .
          } LIMIT 1`;
      } else {
        q = `
        prefix ldp: <http://www.w3.org/ns/ldp#>
        prefix dcat: <http://www.w3.org/ns/dcat#>
        prefix schema: <http://schema.org/> 
        prefix props: <https://w3id.org/props#>
      
        select ?element ?thing
        where 
        { ?element props:globalIdIfcRoot ?thing . ?thing schema:value "${element.name}" .
        } LIMIT 1`;
      }
    
        const result: any = await myEngine.query(q, {
          sources: [lbdLocation],
          fetch: session.fetch,
        })
        const bindings = await result.bindings()

        if (bindings.length > 0) {
          const el = bindings[0].get('?element').value;
          const gltfDataset = gltfLocation.split('/').slice(0, -1).join('/') + '/'
          const lbdDataset = lbdLocation.split('/').slice(0, -1).join('/') + '/'

          const concept = await project.addConcept()
          await concept.addReference(element.name, gltfDataset, gltfLocation)
          await concept.addReference(el, lbdDataset, lbdLocation)
        }
    }
  } 
}

async function determineLBDpropsLevel(source, session) {
  const myEngine = newEngine();

  let q, bindings, results;
  q = `
  prefix ldp: <http://www.w3.org/ns/ldp#>
  prefix dcat: <http://www.w3.org/ns/dcat#>
  prefix schema: <http://schema.org/> 
  prefix props: <https://w3id.org/props#>

  select ?element ?thing
  where 
  { ?element props:globalIdIfcRoot_attribute_simple ?thing .
  } LIMIT 1`;

  bindings = await myEngine.query(q, {
    sources: [source],
    fetch: session.fetch,
  }).then((r: any) => r.bindings())

  if (bindings.length == 0) {
    q = `
    prefix ldp: <http://www.w3.org/ns/ldp#>
    prefix dcat: <http://www.w3.org/ns/dcat#>
    prefix schema: <http://schema.org/> 
    prefix props: <https://w3id.org/props#>
  
    select ?element ?thing
    where 
    { ?element props:globalIdIfcRoot ?thing . ?thing schema:value ?id .
    } LIMIT 1`;

    const bindings = await myEngine.query(q, {
      sources: [source],
      fetch: session.fetch,
    }).then((r: any) => r.bindings())

    if (bindings.length > 0) {
      return 2;
    } else {
      throw Error("could not determine props level");
    }
  } else {
    return 1;
  }
}
