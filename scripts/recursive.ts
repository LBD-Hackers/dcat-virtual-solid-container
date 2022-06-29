import { Catalog } from "../src";
import { generateSession } from "../src/helpers/functions";
import {v4} from "uuid"
import DataService from "../src/helpers/data-service";
import * as path from "path";
import * as fs from "fs"
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP } from "@inrupt/vocab-common-rdf";


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

async function run () {
    const session = await generateSession(stakeholder.options, stakeholder.webId)
    const dataservice = new DataService(session.fetch)
    const root = stakeholder.webId.replace("profile/card#me", "")
    const url1 = root + v4()
    const url2 = root + v4()
    const url3 = root + v4()

    const cat1 = new Catalog(session, url1)
    await cat1.create(true)
    await cat1.addMetadata([{predicate: RDFS.label, object: "test"}])

    const cat2 = new Catalog(session, url2)
    await cat2.create(true)
    await cat1.addDataset(url2)

    const filePath2 = path.join(__dirname, "./duplex.ttl");
    const fileUpload2 = fs.readFileSync(filePath2)
    await dataservice.writeFileToPod(fileUpload2, url3, true, "text/turtle")
    await cat2.addDistribution(url3, [{predicate: RDFS.label, object: "test"}])
    await cat2.addMetadata([{subject: url3, predicate: RDFS.comment, object: "this is a comment"}])

    // const result = await cat2.getContainment("DCAT")
    // console.log('result', result)
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