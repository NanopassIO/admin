export async function preloadBatch(params) {
  await fetch('/.netlify/functions/preload-batch-background', {
      body: JSON.stringify(params),
      method: 'POST'
  })
}

function convertToCsv(items) {
  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  const header = Object.keys(items[0])
  return [
    header.join(','), // header row first
    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n')
}

export async function getBatch(params) {
  const response = await fetch('/.netlify/functions/get-batch', {
      body: JSON.stringify(params),
      method: 'POST'
  })

  const json = await response.json()
  const csv = convertToCsv(json.Items)

  const uriContent = "data:text/csv," + encodeURIComponent(csv);
  window.open(uriContent, 'batch.csv');
}