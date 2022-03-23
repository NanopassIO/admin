import {
  HandlerEvent,
  HandlerContext,
  HandlerCallback
} from '@netlify/functions'
import { DynamoDB } from '../src/db'

export async function handle(data: any, db?: DynamoDB) {
  if (!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    })
  }
  await db.put('marketplace', {
    name: data.name,
    description: data.description,
    image: data.image,
    supply: parseInt(data.supply),
    instock: parseInt(data.instock),
    cost: parseInt(data.cost),
    active: data.active
  })
}

export const handler = (
  event: HandlerEvent,
  _: HandlerContext,
  callback: HandlerCallback
) => {
  const json = JSON.parse(event.body)
  if (json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle(json.data)
    .then((response) => {
      return callback(null, { statusCode: 200, body: JSON.stringify(response) })
    })
    .catch((error) => {
      return callback(null, { statusCode: 500, body: JSON.stringify(error) })
    })
}
