import DynamoDB from "../src/db"
import { toChecksumAddress } from 'ethereum-checksum-address'
import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'


const db = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

async function handle(data : { [key: string]: any }) {
  const address = toChecksumAddress(data.address)

  let account: { [key: string]: any } = {
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

const handler: Handler = (event: HandlerEvent, _: HandlerContext, callback: Function) => {
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

export { handler };