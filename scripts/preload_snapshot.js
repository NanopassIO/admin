require('dotenv').config()
var AWS = require("aws-sdk")
const util = require('util')
const addresses = require('../output/snapshot_prereveal.json')

AWS.config.update({
  region: 'us-east-2',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

var docClient = new AWS.DynamoDB.DocumentClient();
var table = 'batches';

async function handle(batch) {
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
          batch: batch,
          address: x,
          balance: bbCount[x]
        }
      }
      
      await put(params)
    }))

    console.log(`Pushing ${i} to ${i + portions}`)
  }
}

handle('xmas').catch(error => {
  console.log(error)
})