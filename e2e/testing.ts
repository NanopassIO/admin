interface ICollection {
  [key: string]: any
}

interface IObj {
  [key: string]: string
}

export class MockDB {
  db: ICollection
  primaryKeys: IObj
  sortKeys: IObj

  constructor() {
    this.db = {
      batches: {},
      prizes: {},
      accounts: {},
      settings: {}
    }

    this.primaryKeys = {
      batches: 'batch',
      prizes: 'batch',
      accounts: 'address',
      settings: 'active'
    }

    this.sortKeys = {
      batches: 'address',
      prizes: 'name'
    }
  }

  async query(table: string, attributes: [] | any, values: [] | any) {
    if (!Array.isArray(attributes)) {
      attributes = [attributes]
    }

    if (!Array.isArray(values)) {
      values = [values]
    }

    if (this.sortKeys[table]) {
      if (values.length === 1) {
        return { Items: Object.values(this.db[table][values[0]]) }
      } else {
        return { Items: [this.db[table][values[0]][values[1]]] }
      }
    }

    return { Items: this.db[table][values[0]] }
  }

  async get(table: string, _: any, value: string) {
    return { Item: this.db[table][value] }
  }

  async put(table: string, values: IObj) {
    if (this.sortKeys[table]) {
      if (!this.db[table][values[this.primaryKeys[table]]]) {
        this.db[table][values[this.primaryKeys[table]]] = {}
      }

      this.db[table][values[this.primaryKeys[table]]][
        values[this.sortKeys[table]]
      ] = values
    } else {
      this.db[table][values[this.primaryKeys[table]]] = values
    }
  }

  async scan(table: string, limit: number) {
    return { Items: Object.values(this.db[table]).flat().slice(0, limit) }
  }
}

export class MockContractor {
  addresses: string[] = []

  constructor(addresses: string[]) {
    this.addresses = addresses
  }

  async ownerOf(id) {
    return this.addresses[id]
  }
}
