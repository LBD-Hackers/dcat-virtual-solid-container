import { QueryEngine } from "@comunica/query-sparql"
import { DCAT, RDFS } from "@inrupt/vocab-common-rdf"
import { generateSession } from "../../src/helpers/functions"
import LBDS from "../../src/helpers/vocab/lbds"
import N3 from 'n3'

//@ts-ignore
import { parse } from '@frogcat/ttl2jsonld'
import { compact } from 'jsonld'
import { toSparql, translate } from "sparqlalgebrajs"

const credentials = {
    "webId": "http://localhost:3000/dc/profile/card#me",
    "name": "dc",
    "email": "dc@arch.rwth-aachen.de",
    "password": "test123",
    "idp": "http://localhost:3000",
    "satellite": "http://localhost:3030/dc/"
}

const context = {"dcat": "http://www.w3.org/ns/dcat#"}


async function run() {
    const session = await generateSession(credentials, credentials.webId)
    const project: any = await findProject(session, [{ type: "sparql", value: credentials.satellite }])
    const partials = project["dcat:dataset"].map(i => i["@id"])
    const satellites = getSatellites(partials)
    for (const sat of satellites) {
        await getAllProjectDatasets(sat.satellite, sat.partial, session)
    }
}


// async function getAllProjectDatasetsSimultaneous(satellites, session) {
//     const q = `CONSTRUCT {
// ?ds <${DCAT.distribution}> ?dist ;
//     <${RDFS.label}> ?label .
// ?dist <${DCAT.downloadURL}> ?download ;
//     <${DCAT.mediaType}> ?mt .
//     } WHERE {
//         <${partial}> <${DCAT.dataset}> ?ds .
//         ?ds <${DCAT.distribution}> ?dist ;
//             <${RDFS.label}> ?label .
//         ?dist <${DCAT.downloadURL}> ?download ;
//             <${DCAT.mediaType}> ?mt .
//     }`

//     const mapped = satellites.map(s => {return {type: "sparql", value: s}})
//     const data = await constructQuery(q, session, mapped)
//     console.log('data', data)
// }

async function getAllProjectDatasets(satellite, partial, session) {
    const q = `CONSTRUCT {
?ds <${DCAT.distribution}> ?dist ;
    <${RDFS.label}> ?label .
?dist <${DCAT.downloadURL}> ?download ;
    <${DCAT.mediaType}> ?mt .
    } WHERE {
        <${partial}> <${DCAT.dataset}> ?ds .
        ?ds <${DCAT.distribution}> ?dist ;
            <${RDFS.label}> ?label .
        ?dist <${DCAT.downloadURL}> ?download ;
            <${DCAT.mediaType}> ?mt .
    }`

    console.log('q', q)
    const data = await constructQuery(q, session, [{type: "sparql", value: satellite}])
    console.log('data', data)
}


function getSatellites(partials) {
    return partials.map(item => {
        let sat = item.replace('3000', '3030').split('/')
        sat.pop()
        sat = sat.join('/')
        return {satellite: sat, partial: item}
    })
}

async function findProject(session, sources) {
    const q = `CONSTRUCT {?project <${DCAT.dataset}> ?partial} 
    WHERE {
        ?project a <${LBDS.Project}> ; <${DCAT.dataset}> ?partial .
    }`
    return await constructQuery(q, session, sources)
}

async function querySatellite(query, session, sources) {
    const engine = new QueryEngine()
    const newQuery = modifyQuery(query)
    const result: any = engine.query(toSparql(newQuery), {sources, fetch:session.fetch})
    const { data } = await engine.resultToString(result,'application/sparql-results+json');
    return await streamToString(data)
}

function modifyQuery(query) {
    const newQuery = query
    return translate(newQuery)
}

/// UTIL
async function constructQuery(query, session, sources) {
    const engine = new QueryEngine()

    const result = await engine.queryQuads(query, {
        sources,
        fetch: session.fetch
    });

    const doc = await streamToRDF(result)
    return await compact(doc, context);
}

function streamToRDF(stream) {
    return new Promise((resolve, reject) => {
        const myWriter = new N3.Writer({ format: 'application/ld+json' });
        stream.on('data', (quad) => {
            myWriter.addQuad(quad);
        });
        stream.on('error', err => {
            reject(err)
        })
        stream.on("end", () => {
            myWriter.end((error, result) => {
                let jsonLD = parse(result);
                resolve(jsonLD)
            }
            )
        })
    })
}

function streamToString (stream): Promise<string> {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
        return
      });
      stream.on('error', (err) => {
        console.log('error', err);
        reject(err)
      });
      stream.on('end', () => {
        console.log('end')
        if (chunks.length > 0) {resolve(Buffer.concat(chunks).toString('utf8'))}
        else {
          reject("could not find length")
        }
      });
    })
  }

const start = new Date()

console.log(start)
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