import { stringify } from 'csv-stringify/sync';
import { createContract, takeSnapshot } from '../src/eth'
import { writeFileSync } from 'fs';

async function run() {
  const contract = createContract()
  const snapshot = await takeSnapshot(contract)
  writeFileSync(`./output/snapshot_${Date.now()}.csv`, stringify(snapshot.map(x => [x])))
}

run()