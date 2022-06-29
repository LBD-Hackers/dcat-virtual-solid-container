import { generateSession } from "../src/helpers/functions";
import {v4} from "uuid"
import DataService from "../src/helpers/data-service";

const stakeholder = {
    webId: "http://localhost:3000/jeroen/profile/card#me",
    options: {
      name: "dc_token",
      email: "jeroen.werbrouck@hotmail.com",
      password: "test123",
      idp: "http://localhost:3000",
    }
}

async function run () {
    const session = await generateSession(stakeholder.options, stakeholder.webId)
    const dataService = new DataService(session.fetch)
    const root = stakeholder.webId.replace("profile/card#me", "")

    // make project access point
    const localUrl = root + v4()
    const file = Buffer.from(`<i> <am> <turtle> .`)
    // or file = fs.readFileSync(file) => read a path on your computer

    const makePublic = true
    await dataService.writeFileToPod(file, localUrl, makePublic, "text/turtle")
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