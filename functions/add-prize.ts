import DynamoDB from '../src/db';
import {Handler, HandlerEvent, HandlerContext, HandlerResponse} from '@netlify/functions'

async function handle(data: {[k:string]:any}, dbParam?:DynamoDB) {
    const db: DynamoDB = dbParam ? dbParam : new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    })

    await db.put('prizes', {
      batch: data.batch,
      name: data.name,
      description: data.description,
      image: data.image,
      count: data.count
    })
}

const handler: Handler = async (event:HandlerEvent, _:HandlerContext, callback: Function) => {
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

export {handle, handler};