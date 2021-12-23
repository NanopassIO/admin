var AWS = require("aws-sdk")
const { ethers } = require('ethers')
const ABI = require('./abi.json')
const util = require('util')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
const provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY)
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
var table = 'batches';

async function handle(data) {
  const maxSupply = 5555
  const portions = 250
  let addresses = []
  for(let i = 0;i < maxSupply;i+=portions) {
    const section = Array.from(Array(portions), (_,x)=>i+x).filter(x => x < maxSupply)
    console.log(`Fetching ${i} to ${i + portions}`)
    addresses = addresses.concat(await Promise.all(section.map(async x => {
      return await contract.ownerOf(x)
    })))
  }

  let bbCount = {}
  for(const address of addresses) {
    bbCount[address] = bbCount[address] ? bbCount[address] + 1 : 1
  }

  const put = util.promisify(docClient.put).bind(docClient)
  const bbAddresses = Object.keys(bbCount)
  const keyCount = bbAddresses.length
  for(let i = 0;i < keyCount;i+=portions) {
    await Promise.all(bbAddresses.slice(i, i+portions).map(async x => {
      var params = {
        TableName: table,
        Item: {
          batch: data.batch,
          address: x,
          balance: bbCount[x]
        }
      }
      
      await put(params)
    }))

    console.log(`Pushing ${i} to ${i + portions}`)
  }
}

exports.handler = (event, _, callback) => {
  const json = JSON.parse(event.body)  
  if(json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle(json.data).then(response => {
    return callback(null, { statusCode: 200, body: JSON.stringify(response) })
  }).catch(error => {
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}