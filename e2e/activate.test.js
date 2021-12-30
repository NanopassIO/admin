const preload = require('../functions/preload-batch-background').handle
const activate = require('../functions/activate-batch-background').handle
const addPrize = require('../functions/add-prize').handle
const { MockDB, MockContractor } = require('./testing')

async function countBoxes(db, batch) {
  const addresses = await db.query('batches', 'batch', batch)
  let boxCount = 0
  for(const address of addresses.Items) {
    boxCount += address.balance
  }
  return boxCount
}

it("activate batch after preload", async () => {
  const addresses = []
  for(let i = 0;i < 5555;i++) {
    addresses.push(`address${i}`)
  }
  const db = new MockDB()
  const contract = new MockContractor(addresses)
  await preload({ batch: 'test' }, db, contract)

  console.log(`Boxes: ${await countBoxes(db, 'test')}`)

  await addPrize({
    batch: 'test',
    name: 'Test',
    description: 'Test',
    image: 'test.png',
    count: 1
  }, db)

  const addresses2 = addresses.slice(0, 4000)
  const contract2 = new MockContractor(addresses2)
  await activate({ batch: 'test' }, db, contract2)

  console.log(`Boxes: ${await countBoxes(db, 'test')}`)
})