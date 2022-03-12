class MockDB {
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

  async query(table, attributes, values) {
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

  async get(table, _, value) {
    return { Item: this.db[table][value] }
  }

  async put(table, values) {
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

  async scan(table, limit) {
    return { Items: Object.values(this.db[table]).flat().slice(0, limit) }
  }
}

class MockContractor {
  constructor(addresses) {
    this.addresses = addresses
  }

  async ownerOf(id) {
    return this.addresses[id]
  }
}

exports.MockDB = MockDB
exports.MockContractor = MockContractor
