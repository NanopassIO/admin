const DynamoDB = require("../src/db")
const { toChecksumAddress } = require('ethereum-checksum-address')
const { getEmptyAccount } = require("../src/account")

async function handle(data, db) {
  if(!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    })
  }

  const address = toChecksumAddress(data.address)
  const account = (await db.get('accounts', 'address', address)).Item ?? getEmptyAccount(address)

  account.fragments += parseInt(data.amount)

  await db.put('accounts', account)
}

exports.handle = handle
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
