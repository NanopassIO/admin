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

async function handle(data, db, contract) {
  try {      
    if(!db) {
      db = new DynamoDB({
        region: process.env.REGION,
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      })
    }

    let result = await db.query('batches', 'batch', data.batch)
    const existingAddresses = result.Items

    let addressBadluckCount = {};
    for(let i = 0; i < existingAddresses.length; i+=MAX_CONCURRENCY) {
      await Promise.all(existingAddresses.slice(i, i+MAX_CONCURRENCY).map(async a => {
        let account = {
          address: a.address,
          inventory: '[]',
          fragments: 0,
          badLuckCount: 0,
          discord: "",
        }
    
        const fetchedAccount = (await db.get('accounts',{ address: a.address })).Item
    
        if(fetchedAccount !== undefined) {
          account = fetchedAccount
        }

        addressBadluckCount[a.address] = account;
      }))
      console.log(`Pulling accounts ${i} to ${i + MAX_CONCURRENCY}`)
    }

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
      for(let i = 0; i < count + addressBadluckCount[account.address].badLuckCount; i++) {
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

    let prizeAssignment = {}
    for(let i = 0;i < shuffledAddresses.length;i++) {
      const val = prizeAssignment[shuffledAddresses[i]]
      prizeAssignment[shuffledAddresses[i]] = [...(val ? val : [])]

      if (i < prizes.length && prizes[i]) {
        // Assign prizes based on addresses list shuffle. These are winners
        prizeAssignment[shuffledAddresses[i]].push(prizes[i].name)
        // Increase badluck count for winners, in proportion to their number of nanopasses
        addressBadluckCount[shuffledAddresses[i]].badLuckCount = Math.max(0, addressBadluckCount[shuffledAddresses[i]].badLuckCount - Math.ceil((addressBadluckCount[shuffledAddresses[i]].badLuckCount / holderBalance[shuffledAddresses[i]])));
      } else {
        // Increase badluck count for non-winners
        addressBadluckCount[shuffledAddresses[i]].badLuckCount = addressBadluckCount[shuffledAddresses[i]].badLuckCount + 1;
      }
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

        const accountUpdateBadluckCount = {
          ...addressBadluckCount[a]
        }

        await db.put('accounts', accountUpdateBadluckCount)
      }))
      console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
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
