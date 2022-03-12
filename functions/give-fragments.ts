import { DynamoDB } from '../src/db'
import { toChecksumAddress } from 'ethereum-checksum-address'
import { HandlerEvent, HandlerContext, HandlerCallback } from '@netlify/functions'
import { getEmptyAccount } from '../src/account'
import { createContract } from '../src/eth'

export async function handle (data: any, db?: DynamoDB, contract?: any) {
  if (!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    })
  }

  if (!contract) {
    contract = createContract()
  }

  const address = toChecksumAddress(data?.address)
  const account = (await db.get('accounts', 'address', address)).Item ?? getEmptyAccount(address)

  account.fragments += parseInt(data?.amount)

  await db.put('accounts', account)
}

export const handler = (event: HandlerEvent, _: HandlerContext, callback: HandlerCallback) => {
  const json = JSON.parse(event.body || '')
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
