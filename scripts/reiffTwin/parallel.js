const {spawnSync} = require('child_process')
const users = require('./userdata.json')

for (const user of Object.keys(users.users)) {
    const cmd = `ts-node C:/Users/Administrator/Documents/code/lbd_docker/api/scripts/reiffTwin/makeReiffTwin.ts`
    spawnSync(cmd,[, "http://localhost:3000/dc/profile/card#me"], {})
}

