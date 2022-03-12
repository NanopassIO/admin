import retry from 'async-retry'

jest.setTimeout(100000)

export const randomlyFails = async (num) => {
  if (Math.random() > 0.9) {
    throw new Error('Failed')
  }

  return num + 1
}

it('predictably fails after 100 tries', async () => {
  const promises = []
  for (let i = 0; i < 100; i++) {
    promises.push(randomlyFails(1))
  }

  await expect(async () => await Promise.all(promises)).rejects.toThrow()
})

it('able to retry all failed promises', async () => {
  const numbers = []
  for (let i = 0; i < 1000; i++) {
    numbers.push(i)
  }

  await Promise.all(
    numbers.map(async (num) => {
      return await retry(async () => {
        return await randomlyFails(num)
      })
    })
  )
})
