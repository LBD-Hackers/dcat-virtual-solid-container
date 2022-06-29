import { QueryEngine } from '@comunica/query-sparql'
import { generateSession } from "../src/helpers/functions";

const visitor = {
    webId: "http://localhost:3000/oliver/profile/card#me",
    options: {
      name: "olliToken",
      email: "olli@rwth.com",
      password: "test123",
      idp: "http://localhost:3000",
    }
  }

const bucket = "OpenFlatDB" // extracted from the influx Query
const influxSatellite = "http://localhost:2000/" // known (satellite itself)

const bucketURI = influxSatellite + bucket

function aclTemplate(visitor, bucketURI) {
    
}
let aclQuery
if (visitor) {
    aclQuery = `PREFIX acl: <http://www.w3.org/ns/auth/acl#>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
            
            ASK {?authorization
                  a acl:Authorization ;
                  acl:accessTo <${bucketURI}> ;
                  acl:mode acl:Read .
          {?authorization acl:agent <${visitor.webId}> }
          UNION {?authorization acl:agentClass foaf:Agent }
            }`
} else {
    aclQuery = `PREFIX acl: <http://www.w3.org/ns/auth/acl#>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
            
            ASK {?authorization
                  a acl:Authorization ;
                  acl:accessTo <${bucketURI}> ;
                  acl:mode acl:Read ;
                  acl:agentClass foaf:Agent .
            }`
}

async function checkAcl() {
    try {
        const session = await generateSession(visitor.options, visitor.webId)
         
        // session.info.webId contains webId => contains sparql satellite reference

        // query the sparql satellite with the ASK query for ACL => returns bool

        // evaluate boolean: true = ok; false = throw 401

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