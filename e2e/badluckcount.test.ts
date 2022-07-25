import crypto from 'crypto'
import { MockDB, MockContractor } from './testing'
import { handle as preload } from '../functions/preload-batch-auto-background'
import { handle as activate } from '../functions/activate-batch-auto-background'
import { handle as addPrize } from '../functions/add-prize'

async function countBoxes(db, batch) {
  const addresses = await db.query('batches', 'batch', batch)
  let boxCount = 0
  for (const address of addresses.Items) {
    boxCount += address.balance
  }
  console.log(addresses)
  return boxCount
}

async function checkBadLuckCount(db, batch) {
  const addresses = await db.query('batches', 'batch', batch)
  for (const address of addresses.Items) {
    const numWonPrizes = JSON.parse(address.prizes).length
    const acc = (await db.get('accounts', 'address', address.address)).Item
    expect(acc.badLuckCount).toStrictEqual(address.balance - numWonPrizes)
    expect(acc.badLuckCount).toBeLessThanOrEqual(26);
  }
}

let addresses
let db
let contract

beforeEach(() => {
  addresses = []
  for (let i = 0; i < 5555; i += 3) {
    const id = crypto.randomBytes(20).toString('hex')
    const testAddress = `0x${id}`
    addresses.push(testAddress)
    addresses.push(testAddress)
    addresses.push(testAddress)
  }
  db = new MockDB()
  contract = new MockContractor(addresses)
})


it('can ensure that badluck count is less than or equal to 26', async () => {
  // flow? all acounts open a bunch of blackboxes
  await db.put('settings', { active: 'active', batch: 'batch-0' })
  await preload(undefined, db, contract)

  expect(await countBoxes(db, 'batch-1')).toStrictEqual(5555)

  await addPrize(
    {
      batch: 'batch-1',
      name: 'Test',
      description: 'Test',
      image: 'test.png',
      count: 1000
    },
    db
  )

  await addPrize(
    {
      batch: 'batch-1',
      name: 'Test Wl',
      description: 'Test Wl',
      image: 'test.png',
      count: 1000
    },
    db
  )



  const nextBatchAddresses = addresses.slice(0, 4000)
  const nextBatchContract = new MockContractor(nextBatchAddresses)
  await activate(undefined, db, nextBatchContract)

  expect(await countBoxes(db, 'batch-1')).toStrictEqual(4000)
  await checkBadLuckCount(db, 'batch-1')
})