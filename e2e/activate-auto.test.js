const preload = require('../functions/preload-batch-auto-background').handle
const activate = require('../functions/activate-batch-auto-background').handle
const addPrize = require('../functions/add-prize').handle
const { MockDB, MockContractor } = require('./testing')

var crypto = require('crypto')

async function countBoxes(db, batch) {
  const addresses = await db.query('batches', 'batch', batch)
  let boxCount = 0
  for(const address of addresses.Items) {
    boxCount += address.balance
  }
  return boxCount
}

async function checkBadLuckCount(db, batch) {
  const addresses = await db.query('batches', 'batch', batch)
  let totalBadLuck = 0
  for(const address of addresses.Items) {
    const numWonPrizes = JSON.parse(address.prizes).length;
    const acc = (await db.query('accounts', 'address', address.address)).Items;

    expect(acc.badLuckCount).toStrictEqual(address.balance - numWonPrizes)

    totalBadLuck += acc.badLuckCount
  }
  return totalBadLuck
}

it("activate batch after preload", async () => {
  const addresses = []
  for(let i = 0;i < 5555;i+=3) {
    var id = crypto.randomBytes(20).toString('hex');
    var testAddress = "0x"+id
    addresses.push(testAddress)
    addresses.push(testAddress)
    addresses.push(testAddress)
  }
  const db = new MockDB()
  const contract = new MockContractor(addresses)

  await db.put('settings', { active: 'active', batch: 'batch-0' })

  await preload(undefined, db, contract)

  expect(await countBoxes(db, 'batch-1')).toStrictEqual(5555)

  await addPrize({
    batch: 'batch-1',
    name: 'Test',
    description: 'Test',
    image: 'test.png',
    count: 100
  }, db)

  await addPrize({
    batch: 'batch-1',
    name: 'Test Wl',
    description: 'Test Wl',
    image: 'test.png',
    count: 100
  }, db)

  const addresses2 = addresses.slice(0, 4000)
  const contract2 = new MockContractor(addresses2)
  await activate(undefined, db, contract2)

  expect(await countBoxes(db, 'batch-1')).toStrictEqual(4000)
  expect(await checkBadLuckCount(db, 'batch-1')).toStrictEqual(3800)
})
