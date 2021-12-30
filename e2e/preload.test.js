const { handle } = require('../functions/preload-batch-background')
const { MockDB, MockContractor } = require('./testing')

it("preloads batch to database", async () => {
  const addresses = []
  for(let i = 0;i < 5555;i++) {
    addresses.push(`address${i}`)
  }
  const contract = new MockContractor(addresses)
  await handle({ batch: 'test' }, new MockDB(), contract)
})