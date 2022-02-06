const DynamoDB = require("../src/db");
const { createContract, takeSnapshot } = require("../src/eth");
const { shuffle } = require("../src/arrays");

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
  const settingsItems = await db.scanDB({
    TableName: 'settings',
    Limit : 1
  })
  
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
  // Slice list for extra addresses
  const addresses = shuffledAddresses.slice(0, prizes.length)
  let prizeAssignment = {}
  for(let i = 0;i < addresses.length;i++) {
    const val = prizeAssignment[addresses[i]]
    prizeAssignment[addresses[i]] = [...(val ? val : []), prizes[i].name]
  }
  return prizeAssignment;
}

function hasDuplicateWl(prizeAssignment) {
  for(const address in prizeAssignment) {
    let existingPrizes = []
    for(const prize of prizeAssignment[address]) {
      if(prize && prize.name.toLowerCase().includes('wl')) {
        if(existingPrizes.includes(prize.name)) {
          return true
        }

        existingPrizes.push(prize.name)
      }
    }
  }

  return false
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

    const batch = await getNextBatch(db)

    let result = await db.query('batches', 'batch', batch)
    const existingAddresses = result.Items

    // Fetch new list
    if(!contract) {
      contract = createContract()
    }

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
      for(let i = 0;i < count;i++) {
        flatAddresses.push(account.address)
      }
    }

    const prizes = await fetchPrizes(db, batch)

    // Shuffle addresses list 3 times
    console.log('### Address shuffle round 1 ###')
    let shuffledAddresses = shuffle(flatAddresses)
    console.log('### Address shuffle round 2 ###')

    // Keep shuffling until no duplicate WL
    let prizeAssignment;
    for(var i = 0;i < 100;i++) {
      shuffledAddresses = shuffle(shuffledAddresses)
      console.log(`### Address shuffle round ${i + 3} ###`)
      prizeAssignment = assignPrizes(shuffledAddresses, prizes)

      if(!hasDuplicateWl(prizeAssignment)) {
        break;
      }
    }

    // Push array of prizes
    const holderKeys = Object.keys(holderBalance)
    const keyCount = holderKeys.length
    for(let i = 0;i < keyCount;i+=MAX_CONCURRENCY) {
      await Promise.all(holderKeys.slice(i, i+MAX_CONCURRENCY).map(async a => {
        const batchItem = prizeAssignment[a] ? {
            batch: batch,
            address: a,
            balance: Math.max(prizeAssignment[a].length, holderBalance[a]),
            prizes: JSON.stringify(prizeAssignment[a])
          } : {
            batch: batch,
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