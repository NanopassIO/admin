const DynamoDB = require("../src/db");
const { createContract, takeSnapshot } = require("../src/eth");

const MAX_CONCURRENCY = 200

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

async function handle(_, db, contract) {
  if(!db) {
    db = new DynamoDB({
      region: process.env.REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    })
  }

  const batch = await getNextBatch(db)
  
  if(!contract) {
    contract = createContract()
  }
  let addresses = await takeSnapshot(contract)

  let bbCount = {}
  for(const address of addresses) {
    bbCount[address] = bbCount[address] ? bbCount[address] + 1 : 1
  }

  const bbAddresses = Object.keys(bbCount)
  const keyCount = bbAddresses.length
  for(let i = 0;i < keyCount;i+=MAX_CONCURRENCY) {
    await Promise.all(bbAddresses.slice(i, i+MAX_CONCURRENCY).map(async a => {
      await db.put('batches', {
        batch: batch,
        address: a,
        balance: bbCount[a],
        oldBalance: bbCount[a],
        prizes: '[]'
      })
    }))

    console.log(`Pushing ${i} to ${i + MAX_CONCURRENCY}`)
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
