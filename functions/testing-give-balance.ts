import DynamoDB from "../src/db"
import { toChecksumAddress } from 'ethereum-checksum-address'
import { Handler, HandlerEvent, HandlerContext, HandlerCallback, HandlerResponse } from "@netlify/functions"

const db = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

async function handle(data: {[key: string]: any}) {
  try {
    const address = toChecksumAddress(data.address)

    const settingsItems = await db.scan('settings', 1)
    const settings = settingsItems && settingsItems.Items ? settingsItems.Items[0] : {}
    const batch = settings.batch || ''

    await db.put('batches',
      {
        batch: batch,
        address: address,
        balance: parseInt(data.amount),
        prizes: '[]'
      }
    )
  } catch(e: any) {
    console.log(e.message)
  }
}

const handler = (event: HandlerEvent, _: HandlerContext, callback: HandlerCallback) => {
  const json = JSON.parse(event.body || '{}')
  if(json.password !== process.env.PASSWORD || process.env.REGION !== 'us-east-1') {
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

export { handler }