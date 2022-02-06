const util = require('util')
var AWS = require("aws-sdk")

class DynamoDB {
	constructor(props) {
		AWS.config.update(props)
		this.client = new AWS.DynamoDB.DocumentClient()

		this.queryDB = util.promisify(this.client.query).bind(this.client)
		this.putDB = util.promisify(this.client.put).bind(this.client)
		this.scanDB = util.promisify(this.client.scan).bind(this.client)
		this.getDB = util.promisify(this.client.get).bind(this.client)
	}

	async query(table, attributes, values) {
		if (!Array.isArray(attributes)) {
			attributes = [attributes]
		}

		if (!Array.isArray(values)) {
			values = [values]
		}

		return await this.queryDB({
			TableName: table,
			ExpressionAttributeNames: Object.assign({}, ...attributes.map(a => ({
				[`#${a.slice(1, -1)}`]: a
			}))),
			ExpressionAttributeValues: Object.assign({}, ...attributes.map((a, i) => ({
				[`:${a}`]: values[i]
			}))),
			KeyConditionExpression: attributes.map(a => `#${a.slice(1, -1)} = :${a}`)
				.join(' AND ')
		})
	}

	async put(table, values) {
		return await this.putDB({
			TableName: table,
			Item: values
		})
	}

	async scan(table, limit) {
		return await this.scanDB({
      TableName: table,
      Limit : limit
		})
	}
}

module.exports = DynamoDB