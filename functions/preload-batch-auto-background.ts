import { DynamoDB } from '../src/db'
import { createContract, takeSnapshot } from '../src/eth'

const MAX_CONCURRENCY = 200

async function getNextBatch(db: DynamoDB) {
  const settingsItems = await db.scan('settings', 1)
  const settings = settingsItems.Items[0]
  const batch = settings.batch

  return batch
    .split('-')
    .map((b) => {
      if (b === 'batch') {
        return b
      }

      return `${parseInt(b) + 1}`
    })
    .join('-')
}

export async function handle(_?: any, db?: DynamoDB, contract?: any) {
  if (!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    })
  }

  const batch = await getNextBatch(db)
  console.log(`Pre-loading Batch: ${batch}`)

  if (!contract) {
    contract = createContract()
  }
  const addresses = await takeSnapshot(contract)

  const bbCount = {}
  for (const address of addresses) {
    bbCount[address] = bbCount[address] ? bbCount[address] + 1 : 1
  }

  const bbAddresses = Object.keys(bbCount)
  const keyCount = bbAddresses.length
  for (let i = 0; i < keyCount; i += MAX_CONCURRENCY) {
    await Promise.all(
      bbAddresses.slice(i, i + MAX_CONCURRENCY).map(async (a) => {
        await db?.put('batches', {
          batch: batch,
          address: a,
          balance: bbCount[a],
          oldBalance: bbCount[a],
          prizes: '[]'
        })
      })
    )

    console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
  }
}

export const handler = async (event) => {
  const json = JSON.parse(event.body)
  if (json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return {
      statusCode: 401
    }
  }

  try {
    const response = await handle(json.data)
    return { statusCode: 200, body: JSON.stringify(response) }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}
