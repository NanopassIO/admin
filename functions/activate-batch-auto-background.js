const DynamoDB = require("../src/db");
const { createContract, takeSnapshot } = require("../src/eth");
const { shuffle } = require("../src/arrays");
const { getEmptyAccount } = require("../src/account")

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

// Assign prizes based on addresses list shuffle
function assignPrizes(shuffledAddresses, prizes) {
  let prizeAssignment = {}

  for(let i = 0;i < shuffledAddresses.length;i++) {
    if (i < prizes.length && prizes[i]) {
      if(prizeAssignment[shuffledAddresses[i]] === undefined) {
        prizeAssignment[shuffledAddresses[i]] = []
      }

      // Assign prizes based on addresses list shuffle. These are winners
      prizeAssignment[shuffledAddresses[i]].push(prizes[i].name)
    }
  }

  return prizeAssignment;
}

async function handle(_, db, contract) {
  try {      
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
        const fetchedAccount = (await db.get('accounts', a.address)).Item
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

    console.log('### Address Shuffle ###')
    const shuffledAddresses = shuffle(flatAddresses)    
    const prizeAssignment = assignPrizes(shuffledAddresses, prizes)

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
  } catch(e) {
    console.log(e.message)
    throw e
  }
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
