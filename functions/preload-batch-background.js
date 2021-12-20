var AWS = require("aws-sdk")
const { ethers } = require('ethers')
const ABI = require('./abi.json')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9724413afc4848ccad51e8bf04e803cd');
let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

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
  for(let i = 0;i < maxSupply;i+=portions) {
    const section = Array.from(Array(portions), (_,x)=>i+x).filter(x => x < maxSupply)
    console.log(`Fetching ${i} to ${i + portions}`)
    await Promise.all(section.map(async x => {
      var params = {
        TableName: table,
        Item: {
            batch: data.batch,
            address: await contract.ownerOf(x)
        }
      }

      docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
      })
    }))
  }
}

exports.handler = (event, context, callback) => {
  const json = JSON.parse(event.body)  
  if(json.password !== process.env.PASSWORD) {
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