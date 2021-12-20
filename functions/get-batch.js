const faunadb = require('faunadb')
const { ethers } = require('ethers')
const ABI = require('./abi.json')

const CONTRACT_ADDRESS = '0xf54cc94f1f2f5de012b6aa51f1e7ebdc43ef5afc'
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9724413afc4848ccad51e8bf04e803cd');
let contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)


const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
  domain: "db.us.fauna.com"
})

async function handle(data) {

      await client.query(q.Create(q.Collection("batches"), {
        data: {
          batch: data.batch,
          address: await contract.ownerOf(x)
        }
      }))

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