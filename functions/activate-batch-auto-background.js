const DynamoDB = require("../src/db")
const { createContract, takeSnapshot } = require("../src/eth")
const { getEmptyAccount } = require("../src/account")
const crypto = require("crypto")

const MAX_CONCURRENCY = 200

async function fetchPrizes(db, batch) {
  // Fetch list of prizes
  const result = await db.query('prizes', 'batch', batch)
  let prizesDb = result.Items
  let prizes = []
  for(const prizeDb of prizesDb) {
    const prizeCount = parseInt(prizeDb.count)
    for(let i = 0;i < prizeCount;i++) {
      prizes.push(prizeDb)
    }
  }

  return prizes
}

async function getNextBatch(db) {
  const settingsItems = await db.scan('settings', 1)
  const settings = settingsItems.Items[0]
  const batch = settings.batch

  return batch.split('-').map(b => {
    if(b === 'batch') {
      return b
    }

    return `${parseInt(b) + 1}`
  }).join('-')
}

function assignPrizes(flatAddresses, prizes, holderBalance) {
  let prizeAssignment = {}

  do {
    const i = crypto.randomInt(flatAddresses.length)
    const prize = prizes[0]
    const address = flatAddresses[i]

    const previousPrizes = prizeAssignment[address]
    if(previousPrizes) {
      if(previousPrizes.length >= holderBalance[address]) {
        continue
      }

      if(previousPrizes.includes(prize.name)) {
        continue
      }
    }

    prizes.shift()
    flatAddresses.splice(i, 1)
    prizeAssignment[address] = [...(previousPrizes ?? []), prize.name]
    console.log(`${address} has won ${prize.name}`)
  } while(prizes.length > 0)

  return prizeAssignment;
}

async function handle(_, db, contract) {
  if(!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    })
  }

  if(!contract) {
    contract = createContract()
  }

  const batch = await getNextBatch(db)
  console.log(`Activating Batch: ${batch}`)

  let result = await db.query('batches', 'batch', batch)
  const existingAddresses = result.Items

  let existingAccounts = {};
  for(let i = 0; i < existingAddresses.length; i+=MAX_CONCURRENCY) {
    await Promise.all(existingAddresses.slice(i, i+MAX_CONCURRENCY).map(async a => {
      const fetchedAccount = (await db.get('accounts', 'address', a.address)).Item
      existingAccounts[a.address] = {...getEmptyAccount(a.address), ...(fetchedAccount ?? {})}
    }))
    console.log(`Pulling accounts ${i} to ${i + MAX_CONCURRENCY}`)
  }

  // Fetch new list
  const postReveal = await takeSnapshot(contract)

  let postRH = {}
  for(const address of postReveal) {
    postRH[address] = postRH[address] ? postRH[address] + 1 : 1
  }

  // Compare lists
  let flatAddresses = []
  const holderBalance = {}
  for(const account of existingAddresses) {
    const count = Math.min(account.balance ?? 0, postRH[account.address] ?? 0)
    holderBalance[account.address] = count
    const entryCount = count + existingAccounts[account.address].badLuckCount
    for(let i = 0; i < entryCount; i++) {
      flatAddresses.push(account.address)
    }
  }

  const prizes = await fetchPrizes(db, batch)

  const prizeAssignment = assignPrizes(flatAddresses, prizes, holderBalance)

  // Push array of prizes
  const holderKeys = Object.keys(holderBalance)
  const keyCount = holderKeys.length
  for(let i = 0;i < keyCount;i+=MAX_CONCURRENCY) {
    await Promise.all(holderKeys.slice(i, i+MAX_CONCURRENCY).map(async a => {
      const batchItem = {
        batch: batch,
        address: a,
        balance: prizeAssignment[a] ? Math.max(prizeAssignment[a].length, holderBalance[a]) : holderBalance[a],
        prizes: prizeAssignment[a] ? JSON.stringify(prizeAssignment[a]) : '[]'
      }

      const account = existingAccounts[a]
      const badLuckCount = account.badLuckCount
      if(prizeAssignment[a]) {
        account.badLuckCount = Math.max(0, badLuckCount - Math.ceil(badLuckCount / holderBalance[a]))
      } else {
        account.badLuckCount += holderBalance[a]
      }
  
      await db.put('batches', batchItem)
      await db.put('accounts', account)
    }))
    console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
  }

  // Set batch as active    
  await db.put('settings', {
    active: 'active',
    batch: batch
  })
}

exports.handle = handle
exports.handler = async (event) => {
  const json = JSON.parse(event.body)
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
