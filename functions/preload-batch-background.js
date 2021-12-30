const DynamoDB = require("../src/db");
const { createContract, takeSnapshot } = require("../src/eth");

async function handle(data, db, contract) {
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
  let addresses = await takeSnapshot(contract)

  let bbCount = {}
  for(const address of addresses) {
    bbCount[address] = bbCount[address] ? bbCount[address] + 1 : 1
  }

  const portions = 250
  const bbAddresses = Object.keys(bbCount)
  const keyCount = bbAddresses.length
  for(let i = 0;i < keyCount;i+=portions) {
    await Promise.all(bbAddresses.slice(i, i+portions).map(async a => {
      await db.put('batches', {
        batch: data.batch,
        address: a,
        balance: bbCount[a],
        prizes: '[]'
      })
    }))

    console.log(`Pushing ${i} to ${i + portions}`)
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