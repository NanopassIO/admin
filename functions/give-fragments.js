const DynamoDB = require("../src/db")
const { toChecksumAddress } = require('ethereum-checksum-address')

const db = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

async function handle(data) {
  const address = toChecksumAddress(data.address)

  let account = {
    address: address,
    inventory: '[]',
    fragments: 0
  }

  const fetchedAccount = (await db.getDB({
    TableName : 'accounts',
    Key: {
      address: address
    }
  })).Item

  if(fetchedAccount !== undefined) {
    account = fetchedAccount
  }

  account.fragments += parseInt(data.amount)

  await db.put('accounts', account)
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