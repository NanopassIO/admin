const faunadb = require('faunadb')

const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
  domain: "db.us.fauna.com"
})

async function handle(params) {
  return await client.query(q.Create(q.Collection("batches"), params))
}

exports.handler = (event, context, callback) => {
  const data = JSON.parse(event.body)  
  if(data.password !== process.env.PASSWORD) {
    return callback(null, {
      statusCode: 401
    })
  }

  handle(data.params).then(response => {
    return callback(null, { statusCode: 200, body: JSON.stringify(response) })
  }).catch(error => {
    return callback(null, { statusCode: 500, body: JSON.stringify(error) })
  })
}