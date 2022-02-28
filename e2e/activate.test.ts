import { handle as preload } from '../functions/preload-batch-background';
import { handle as activate } from '../functions/activate-batch-background';
import { handle as addPrize } from '../functions/add-prize';
import { MockDB, MockContractor } from './testing';
import crypto from 'crypto';

async function countBoxes(db: MockDB, batch: string) {
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
    var id = crypto.randomBytes(20).toString('hex');
    var testAddress = "0x"+id
    addresses.push(testAddress)
  }

  const db = new MockDB()
  const contract = new MockContractor(addresses)
  // @ts-ignore --> db is of type MockDB when preload() is expecting type DynamoDB
  await preload({ batch: 'test' }, db, contract)

  expect(await countBoxes(db, 'test')).toStrictEqual(5555)

  await addPrize({
    batch: 'test',
    name: 'Test',
    description: 'Test',
    image: 'test.png',
    count: 100
    // @ts-ignore  --> db is of type MockDB when addPrize() is expecting type DynamoDB
  }, db)

  const addresses2 = addresses.slice(0, 4000)
  const contract2 = new MockContractor(addresses2)
  // @ts-ignore --> db is of type MockDB when activate() is expecting type DynamoDB
  await activate({ batch: 'test' }, db, contract2)

  expect(await countBoxes(db, 'test')).toStrictEqual(4000)
})