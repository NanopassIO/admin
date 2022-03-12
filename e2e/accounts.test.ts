import crypto from 'crypto'
import { toChecksumAddress } from 'ethereum-checksum-address'
import { MockDB, MockContractor } from './testing'
import { handle as giveFragments } from '../functions/give-fragments'

let db
let contract

beforeEach(() => {
  db = new MockDB()
  contract = new MockContractor([])
})

it('can give fragments', async () => {
  await db.put('settings', { active: 'active', batch: 'batch-0' })

  const id = crypto.randomBytes(20).toString('hex')
  const testAddress = toChecksumAddress(`0x${id}`)
  await giveFragments({ address: testAddress, amount: 10 }, db, contract)
  expect(
    (await db.get('accounts', 'address', testAddress)).Item.fragments
  ).toStrictEqual(10)
})
