const DynamoDB = require("../src/db");
const { createContract, takeSnapshot } = require("../src/eth");
const { shuffle } = require("../src/arrays");

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

async function handle(data, db, contract) {
  try {      
    if(!db) {
      db = new DynamoDB({
        region: 'us-east-2',
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      })
    }

    let result = await db.query('batches', 'batch', data.batch)
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

    const prizes = await fetchPrizes(db, data.batch)

    // Shuffle addresses list
    let shuffledAddresses = shuffle(flatAddresses)

    // Slice list for extra addresses
    shuffledAddresses = shuffledAddresses.slice(0, prizes.length)

    // Assign prizes based on addresses list shuffle
    let prizeAssignment = {}
    for(let i = 0;i < shuffledAddresses.length;i++) {
      const val = prizeAssignment[shuffledAddresses[i]]
      prizeAssignment[shuffledAddresses[i]] = [...(val ? val : []), prizes[i].name]
    }

    // Push array of prizes
    const portions = 250
    const holderKeys = Object.keys(holderBalance)
    const keyCount = holderKeys.length
    for(let i = 0;i < keyCount;i+=portions) {
      await Promise.all(holderKeys.slice(i, i+portions).map(async a => {
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
      console.log(`Pushing ${i} to ${i + portions}`)
    }

    // Set batch as active    
    await db.put('settings', {
      active: 'active',
      batch: data.batch
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