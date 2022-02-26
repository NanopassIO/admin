import DynamoDB from "../src/db";
import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const db = new DynamoDB({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
})

async function handle(data: {[key:string]: any}) {
  try {
    return await db.query('batches', 'batch', data.batch)
  } catch(e: any) {
    console.log(e.message)
  }

  return
}

const handler: Handler = (event: HandlerEvent, context: HandlerContext, callback: Function) => {
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

export{ handler };