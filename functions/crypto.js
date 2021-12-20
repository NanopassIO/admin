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