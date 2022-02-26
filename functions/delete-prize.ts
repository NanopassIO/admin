import DynamoDB from "../src/db"
import { Handler, HandlerEvent, HandlerContext, HandlerResponse, HandlerCallback } from '@netlify/functions'

const db: DynamoDB = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

async function handle(data: {[key: string]: any}) {
  await db.put('prizes', {
    batch: data.batch,
    name: data.name,
    count: 0
  })
}

const handler = async (event: HandlerEvent, _: HandlerContext, callback: HandlerCallback) => {
  const json = JSON.parse(event.body || '{}')
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

export { handler }
