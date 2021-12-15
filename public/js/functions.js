export async function pushBatch(params) {
  await fetch('/.netlify/functions/push-batch', {
      body: JSON.stringify(params),
      method: 'POST'
  })
}