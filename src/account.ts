export const getEmptyAccount = function (address) {
  return {
    address: address,
    inventory: '[]',
    fragments: 0,
    badLuckCount: 0,
    discord: ''
  }
}
