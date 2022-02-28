interface obj { [key: string]: any; }

class MockDB {
  db:obj = {
    batches: {},
    prizes: {},
    accounts: {},
    settings: {},
  }

  primaryKeys:obj = {
    'batches': 'batch',
    'prizes': 'batch',
    'accounts': 'address',
    'settings': 'active'
  }

  sortKeys:obj = {
    'batches': 'address',
    'prizes': 'name',
  }

	async query(table:string, attributes:[] | any, values:[] | any) {
		if (!Array.isArray(attributes)) {
			attributes = [attributes]
		}

		if (!Array.isArray(values)) {
			values = [values]
		}

    if(this.sortKeys[table]) {
      if(values.length === 1) {
        return { Items: Object.values(this.db[table][values[0]]) }
      } else {
        return { Items: [this.db[table][values[0]][values[1]]] }
      }

    }

    return { Items: this.db[table][values[0]] }
	}

	async get(table:string, _:any, value:string) {
    return { Item: this.db[table][value] }
	}

	async put(table:string, values:obj) {
		if(this.sortKeys[table]) {
      if(!this.db[table][values[this.primaryKeys[table]]]) {
        this.db[table][values[this.primaryKeys[table]]] = {}
      }

      this.db[table][values[this.primaryKeys[table]]][values[this.sortKeys[table]]] = values
    } else {
      this.db[table][values[this.primaryKeys[table]]] = values
    }
	}

  async scan(table:string, limit:number) {
		return { Items: Object.values(this.db[table]).flat().slice(0, limit) }
	}
}

class MockContractor {
  addresses:string[] = []
  constructor(addresses:string[]) {
    this.addresses = addresses
  }

  async ownerOf(id:number) {
    return this.addresses[id]
  }
}

export { MockDB, MockContractor }