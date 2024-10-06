'use server'

const fs = require('fs');
const archiver = require('archiver');

const FETCH_URL = "https://raw.githubusercontent.com/qdm12/gluetun/master/internal/storage/servers.json";

export async function getProviders() {
    let json = await getJson();
    if (!json)
        return;

    return await getProvider(json);
}

export async function generateConfigs(provider, userPrivateKey) {
    let providerName = provider.name
    let dirPath = `./${providerName}`
    await createDirectory(dirPath);

    let servers = provider.data.servers;

    for (let server of servers) {
        let name = server.hostname.substring(0, server.hostname.length >= 6 ? 6 : server.hostname.length);
        let fileName = `${name}.conf`
        let serverPublicKey = server.wgpubkey;
        let serverEndpoints = "";
        let port = 51820;

        for (let ip of server.ips) {
            serverEndpoints += `, ${ip}:${port}`;
        }

        serverEndpoints = serverEndpoints.substring(1).trim();

        let filePath = `${dirPath}/${fileName}`;
        let fileContent = getWireGuardConfig(userPrivateKey, serverPublicKey, serverEndpoints);

        await writeToFile(filePath, fileContent);
    }

    let zipFilePath = `${dirPath}/${providerName}.zip`;

    await zipDirectory(dirPath, zipFilePath);

    let base64FileContent = await readFileAsBase64(zipFilePath);

    await removeDirectory(dirPath);

    return base64FileContent;
}

async function createDirectory(dirPath) {
    await removeDirectory(dirPath)
    await fs.promises.mkdir(dirPath);
}

async function removeDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return;
    }

    await fs.promises.rm(dirPath, { recursive: true });
}

async function getJson() {
    try {
        let req = await fetch(FETCH_URL);
        let json = await req.json();
        return json;

    } catch (error) {
        console.log(error);
    }

    return null;
}

async function getProvider(json) {
    let providerList = [];

    let allKeys = Object.keys(json);
    for (let index = 0; index < allKeys.length; index++) {
        let key = allKeys[index];
        if (json[key] instanceof Object) {
            let provider = json[key];
            let servers = provider.servers
            if (!servers || !servers.filter(x => x.vpn === "wireguard")) {
                continue;
            }
            providerList.push({
                name: key,
                data: provider
            });
        }
    }

    return providerList;
}

async function zipDirectory(sourceDir, zipFilePath) {
    let output = fs.createWriteStream(zipFilePath);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function readFileAsBase64(filePath) {
    try {
        let data = await fs.promises.readFile(filePath);
        return data.toString('base64');
    } catch (error) {
        console.log(error);
    }

    return "";
}

function getWireGuardConfig(userPrivateKey, serverPublicKey, serverEndpoints) {
    let config = `# Generated using https://github.com/00000vish/wireguard-config-gen\n\n`

    config += userPrivateKey.length === 0 ? "" : `[Interface]\nPrivateKey = ${userPrivateKey.trim()}\n`
    config += `[Peer]\nPublicKey = ${serverPublicKey}\n`
    config += `AllowedIPs = 0.0.0.0/0\n`
    config += `Endpoint = ${serverEndpoints}`

    return config;
}

async function writeToFile(filePath, content) {
    try {
        await fs.promises.writeFile(filePath, content);
        return true;
    } catch (err) {
        console.log(err);
    }

    return false;
}



