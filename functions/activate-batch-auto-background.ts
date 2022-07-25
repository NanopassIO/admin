import { DynamoDB } from '../src/db'
import { createContract, takeSnapshot } from '../src/eth'
import { getEmptyAccount } from '../src/account'
import crypto from 'crypto'

const MAX_CONCURRENCY = 200
const BAD_LUCK_COUNT_CAP = 26;

async function fetchPrizes(db: DynamoDB, batch: string) {
  // Fetch list of prizes
  const result = await db.query('prizes', 'batch', batch)
  const prizesDb = result?.Items
  const prizes: any[] = []

  for (const prizeDb of prizesDb) {
    const prizeCount = parseInt(prizeDb.count)
    for (let i = 0; i < prizeCount; i++) {
      prizes.push(prizeDb)
    }
  }

  return prizes
}

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

function assignPrizes(flatAddresses, prizes, holderBalance) {
  const prizeAssignment = {}

  while (prizes.length > 0) {
    const i = crypto.randomInt(flatAddresses.length)
    const prize = prizes[0]
    const address = flatAddresses[i]

    const previousPrizes = prizeAssignment[address]
    if (previousPrizes) {
      if (previousPrizes.length >= holderBalance[address]) {
        continue
      }

      if (previousPrizes.includes(prize.name)) {
        continue
      }
    }

    prizes.shift()
    flatAddresses.splice(i, 1)
    prizeAssignment[address] = [...(previousPrizes ?? []), prize.name]
    console.log(`${address} has won ${prize.name}`)
  }

  return prizeAssignment
}

export async function handle(_?: any, db?: DynamoDB, contract?: any) {
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

  const batch = await getNextBatch(db)
  console.log('BATCH', batch)

  const result = await db.query('batches', 'batch', batch)
  const existingAddresses = result.Items

  const existingAccounts = {}
  for (let i = 0; i < existingAddresses.length; i += MAX_CONCURRENCY) {
    await Promise.all(
      existingAddresses.slice(i, i + MAX_CONCURRENCY).map(async (a) => {
        const fetchedAccount = (await db?.get('accounts', 'address', a.address))
          .Item
        existingAccounts[a.address] = {
          ...getEmptyAccount(a.address),
          ...(fetchedAccount ?? {})
        }
      })
    )
    console.log(`Pulling accounts ${i} to ${i + MAX_CONCURRENCY}`)
  }

  // Fetch new list
  const postReveal = await takeSnapshot(contract)

  const postRH = {}
  for (const address of postReveal) {
    postRH[address] = postRH[address] ? postRH[address] + 1 : 1
  }

  // Compare lists
  const flatAddresses: any[] = []
  const holderBalance = {}
  for (const account of existingAddresses) {
    const count = Math.min(account.balance ?? 0, postRH[account.address] ?? 0)
    holderBalance[account.address] = count
    const entryCount = count + existingAccounts[account.address].badLuckCount
    for (let i = 0; i < entryCount; i++) {
      flatAddresses.push(account.address)
    }
  }

  const prizes = await fetchPrizes(db, batch)

  const prizeAssignment = assignPrizes(flatAddresses, prizes, holderBalance)

  // Push array of prizes
  const holderKeys = Object.keys(holderBalance)
  const keyCount = holderKeys.length
  for (let i = 0; i < keyCount; i += MAX_CONCURRENCY) {
    await Promise.all(
      holderKeys.slice(i, i + MAX_CONCURRENCY).map(async (a) => {
        const balance = holderBalance[a]
        const prizeArray = prizeAssignment[a]
        const batchItem = {
          batch: batch,
          address: a,
          balance: prizeArray ? Math.max(prizeArray.length, balance) : balance,
          prizes: JSON.stringify(prizeArray ?? [])
        }

        const account = existingAccounts[a]
        const badLuckCount = account.badLuckCount
        if (prizeArray) {
          // Minus `Math.ceil(badLuckCount / balance)` per prize
          account.badLuckCount = Math.max(
            0,
            badLuckCount - prizeArray.length * Math.ceil(badLuckCount / balance)
          )

          // Add 1 per box without prize
          account.badLuckCount += Math.max(0, balance - prizeArray.length)
        } else {
          account.badLuckCount += balance
        }

        // Enforce a cap to badLuckCount before it's committed back to
        // the database.
        if (account.badLuckCount > BAD_LUCK_COUNT_CAP ){
          account.badLuckCount = BAD_LUCK_COUNT_CAP;
        }

        await db?.put('batches', batchItem)
        await db?.put('accounts', account)
      })
    )
    console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
  }

  // Set batch as active
  await db.put('settings', {
    active: 'active',
    batch: batch,
    lastActivateTimestamp: Date.now()
  })
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

export const lambda = async () => {
  try {
    const response = await handle()
    return { statusCode: 200, body: JSON.stringify(response) }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: JSON.stringify(error) }
  }
}
