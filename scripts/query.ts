import {QueryEngine} from '@comunica/query-sparql'

import { Catalog } from "../src";
import { generateSession } from "../src/helpers/functions";
import {v4} from "uuid"
import DataService from "../src/helpers/data-service";
import * as path from "path";
import * as fs from "fs"
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP, RDF } from "@inrupt/vocab-common-rdf";
import LBDS from '../src/helpers/vocab/lbds'
import AccessService from "../src/helpers/access-service";

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
  try {
    const engine = new QueryEngine()
    const session = await generateSession(stakeholder.options, stakeholder.webId)
    const query = `INSERT DATA {<ex:s> <ex:j> <ex:e> }`
    const sources: any = [
      "http://localhost:3000/jeroen/3c94e98c-3238-4a86-b1c5-0bc3dec30c17"
    ]
    const endpoint = "http://localhost:3030/jeroen/update"
    const results = await engine.queryVoid(query, { sources, destination: {type: "sparql", value: endpoint} });
  } catch (error) {
    console.log('error', error)
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