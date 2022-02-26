import DynamoDB from "../src/db";
import { createContract, takeSnapshot }from "../src/eth";
import { shuffle } from "../src/arrays";
import { Handler, HandlerEvent, HandlerContext, HandlerCallback, HandlerResponse } from "@netlify/functions"

const MAX_CONCURRENCY = 200

async function fetchPrizes(db: DynamoDB, batch: string) {
  // Fetch list of prizes
  const result = await db.query('prizes', 'batch', batch)
  let prizesDb = result.Items || [];
  let prizes = []
  for(const prizeDb of prizesDb) {
    const prizeCount = parseInt(prizeDb.count)
    for(let i = 0;i < prizeCount;i++) {
      prizes.push(prizeDb)
    }
  }

  return prizes
}

async function handle(data: { [key: string]: any }, dbParam?: DynamoDB, contract?: any) {
  try {
    const db: DynamoDB = dbParam || new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    })

    let result = await db.query('batches', 'batch', data.batch)
    const existingAddresses = result.Items || []

    // Fetch new list
    if(!contract) {
      contract = createContract()
    }

    const postReveal = await takeSnapshot(contract)

    let postRH: { [key: string]: number } = {}
    for(const address of postReveal) {
      postRH[address] = postRH[address] ? postRH[address] + 1 : 1
    }

    // Compare lists
    let flatAddresses = []
    const holderBalance: { [key: string]: number } = {}
    for(const account of existingAddresses) {
      const count = Math.min(account.balance ?? 0, postRH[account.address] ?? 0)
      holderBalance[account.address] = count
      for(let i = 0;i < count;i++) {
        flatAddresses.push(account.address)
      }
    }

    const prizes = await fetchPrizes(db, data.batch)

    // Shuffle addresses list 3 times
    console.log('### Address shuffle round 1 ###')
    let shuffledAddresses = shuffle(flatAddresses)
    console.log('### Address shuffle round 2 ###')
    shuffledAddresses = shuffle(shuffledAddresses)
    console.log('### Address shuffle round 3 ###')
    shuffledAddresses = shuffle(shuffledAddresses)

    // Slice list for extra addresses
    shuffledAddresses = shuffledAddresses.slice(0, prizes.length)

    // Assign prizes based on addresses list shuffle
    let prizeAssignment: { [key: string]: any[] } = {}
    for(let i = 0; i < shuffledAddresses.length; i++) {
      const val = prizeAssignment[shuffledAddresses[i]]
      prizeAssignment[shuffledAddresses[i]] = [...(val ? val : []), prizes[i].name]
    }

    // Push array of prizes
    const holderKeys = Object.keys(holderBalance)
    const keyCount = holderKeys.length
    for(let i = 0;i < keyCount;i+=MAX_CONCURRENCY) {
      await Promise.all(holderKeys.slice(i, i+MAX_CONCURRENCY).map(async a => {
        const batchItem = prizeAssignment[a] ? {
            batch: data.batch,
            address: a,
            balance: Math.max(prizeAssignment[a].length, holderBalance[a]),
            prizes: JSON.stringify(prizeAssignment[a])
          } : {
            batch: data.batch,
            address: a,
            balance: holderBalance[a],
            prizes: '[]'
          }
        await db.put('batches', batchItem)
      }))
      console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
    }

    // Set batch as active
    await db.put('settings', {
      active: 'active',
      batch: data.batch
    })
  } catch(e: any) {
    console.log(e.message)
    throw e
  }
}

const handler: Handler = async (event) => {
  const json = JSON.parse(event.body || '{}')
  if(json.password !== process.env.PASSWORD) {
    console.log('Unauthorized access')
    return {
      statusCode: 401
    }
  }

  try {
    const response = await handle(json.data)
    return { statusCode: 200, body: JSON.stringify(response) }
  } catch(error) {
    console.log(error)
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}

export { handle, handler }
