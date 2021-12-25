import fetch from 'node-fetch';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function start() {
    const url = 'https://metadata.nanopass.io/metadata/5554.json'; 
    const response = await fetch(url);
    console.log(JSON.stringify(await response.json(), null, 2))
}

start()