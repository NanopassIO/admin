import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda'
import { DynamoDB } from '../src/db'

export async function handle(data: any, db?: DynamoDB) {
  if (!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    })
  }
  await db.put('gameprize', {
    name: data.name,
    description: data.description,
    image: data.image,
    batchNo: data.batch
  })
}

export const handler = (
  event: APIGatewayEvent,
  _: Context,
  callback: APIGatewayProxyCallback
) => {
  console.log(event)
  const json = JSON.parse(event?.body || '')
  if (json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return callback(null, {
      statusCode: 401
    })
  }

  handle(json.data)
    .then((response) => {
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify(response)
      })
    })
    .catch((error) => {
      console.log(JSON.stringify(error))
      return callback(null, { statusCode: 500, body: JSON.stringify(error) })
    })
}
