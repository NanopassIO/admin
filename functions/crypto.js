const { ethers } = require('ethers')
const ABI = require('./abi.json')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'

exports.handler = async (event, context, callback) => {
    // "event" has information about the path, body, headers, etc. of the request
    console.log('event', event)
    // "context" has information about the lambda environment and user details
    console.log('context', context)

    let p = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY)
    let c = new ethers.Contract(CONTRACT_ADDRESS, ABI, p)
    const owner = await c.ownerOf(0)

    // The "callback" ends the execution of the function and returns a response back to the caller
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        data: owner
      })
    }) 
  }


/*
// Verify signed signature


const digest = ethers.utils.id('blackbox');

const signer = provider.getSigner();
const signature = await signer.signMessage(digest)
const joinedSignature = ethers.utils.joinSignature(signature);
// 0xf0a760680a88ec3efff6e68ebce051b948cffd51d5814a448c0b32e35f2c753a6862077f01ae8edfccd524ba843b9340bcedfeafe62167fdd8517ca8528f398b1c

const recoveredAddress = ethers.utils.recoverAddress(digest, signature);
// 0x2f112ad225E011f067b2E456532918E6D679F978
*/