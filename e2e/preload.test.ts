import { handle } from '../functions/preload-batch-background';
import { MockDB, MockContractor } from './testing';

it("preloads batch to database", async () => {
  const addresses = []
  for(let i = 0;i < 5555;i++) {
    addresses.push(`address${i}`)
  }
  const contract = new MockContractor(addresses)
  // @ts-ignore --> 2nd parameter "new MockDB()" is of type MockDB when handle() is expecting type DynamoDB
  await handle({ batch: 'test' }, new MockDB(), contract)
})