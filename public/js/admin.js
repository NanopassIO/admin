import { h, render } from 'https://unpkg.com/preact@latest?module'
import {
  useState,
  useEffect
} from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module'
import htm from 'https://unpkg.com/htm?module'
import {
  preloadBatch,
  getBatch,
  activateBatch,
  getPrizeList,
  addPrize,
  deletePrize,
  getActiveBatch,
  overrideActiveBatch,
  giveFragments,
  getAccounts,
  getPurchases,
  winners,
  giveBalance,
  addMarketplaceItem,
  getMarketplaceItems,
  getAddressLogs
} from './functions.js'
import { tabFunction, openDefaultTab } from './tabs.js'
import moment from '../lib/moment.module.js'

const $ = window.$
const html = htm.bind(h)

const lastWeekBatch = (batch) => {
  return batch
    .split('-')
    .map((b) => {
      if (b === 'batch') {
        return b
      }

      return `${parseInt(b) - 1}`
    })
    .join('-')
}

function App() {
  const [error, setError] = useState('')
  const [activeBatch, setActiveBatch] = useState('')
  const [inventoryImage, setInventoryImage] = useState('')
  const [inventoryName, setInventoryName] = useState('')
  const [marketplaceImage, setMarketplaceImage] = useState('')
  const [marketplaceName, setMarketplaceName] = useState('')
  const [marketplaceItems, setMarketplaceItems] = useState([])

  console.log(marketplaceItems[0]?.itemStartTimestamp)
  console.log(marketplaceItems[10]?.itemStartTimestamp)

  const handleGetMarketplaceItems = async () => {
    const results = await getMarketplaceItems(setError)
    setMarketplaceItems(results)
  }

  useEffect(() => {
    getActiveBatch(setError).then((settings) => {
      setActiveBatch(settings.batch)
    })
    handleGetMarketplaceItems()
  }, [activeBatch])

  return html`
    <label for="password">Password:</label>
    <input
      value=""
      type="password"
      id="password"
      name="password"
      class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    /><br /><br />
    <span style="color: red">${error}</span>

    <div class="admin-container">
      <div class="tab">
        <button
          class="tablinks"
          id="wm-button"
          onClick=${() => tabFunction('wm-button', 'winner-management')}
        >
          Winner Management
        </button>
        <button
          class="tablinks"
          id="bm-button"
          onClick=${() => tabFunction('bm-button', 'batch-management')}
        >
          Batch Management
        </button>
        <button
          class="tablinks"
          id="pm-button"
          onClick=${() => tabFunction('pm-button', 'prize-management')}
        >
          Prize Management
        </button>
        <button
          class="tablinks"
          id="mm-button"
          onClick=${() => tabFunction('mm-button', 'marketplace-management')}
        >
          Marketplace Management
        </button>
        <button
          class="tablinks"
          id="um-button"
          onClick=${() => tabFunction('um-button', 'user-management')}
        >
          User Management
        </button>
      </div>

      <div id="winner-management" class="tabcontent">
        <h1>Winner Management</h1>
        <br />
        <div>Active Batch: ${activeBatch}</div>
        <div>Last Weeks Batch: ${lastWeekBatch(activeBatch)}</div>
        <br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              },
              'wl',
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get WL winners for this week</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              },
              'nft',
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get NFT winners for this week</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              },
              null,
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get all winners for this week</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              },
              'wl',
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get WL winners for last week</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              },
              'nft',
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get NFT winners for last week</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            winners(
              {
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              },
              null,
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get all winners for last week</button
        ><br /><br />
      </div>

      <div id="batch-management" class="tabcontent">
        <h1>Batch Management</h1>
        <div>Active Batch: ${activeBatch}</div>
        <div class="input-group">
          <label for="batch">Batch:</label>
          <input
            type="batch"
            id="batch"
            name="batch"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          /><br /><br />
        </div>
        <button
          id="click"
          onClick=${
            () => alert('Disabled for safety')
            // preloadBatch(
            //   {
            //     password: $('#password').val(),
            //     data: {
            //       batch: $('#batch').val()
            //     }
            //   },
            //   setError
            // )
          }
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Preload Batch</button
        ><br /><br />
        <button
          id="click"
          onClick=${
            () => alert('Disabled for safety')
            // activateBatch(
            //   {
            //     password: $('#password').val(),
            //     data: {
            //       batch: $('#batch').val()
            //     }
            //   },
            //   setError
            // )
          }
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Randomize and Activate Batch</button
        ><br /><br />
        <button
          id="click"
          onClick=${
            () => alert('Disabled for safety')
            // overrideActiveBatch(
            //   {
            //     password: $('#password').val(),
            //     data: {
            //       batch: $('#batch').val()
            //     }
            //   },
            //   setError
            // )
          }
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Override Active Batch</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            getBatch(
              {
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Batch</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            getPrizeList(
              {
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Prize List</button
        ><br /><br />
      </div>

      <div id="prize-management" class="tabcontent">
        <h1>Prize Management</h1>
        <div class="inventory-item">
          <picture>
            <img src="${inventoryImage}" class="inventoryImage" />
          </picture>
          <label class="inventoryLabel">${inventoryName}</label>
        </div>
        <div class="input-group">
          <label for="prizeBatch">Batch:</label>
          <input
            type="prizeBatch"
            id="prizeBatch"
            name="prizeBatch"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="input-group">
          <label for="prizeName">Prize Name:</label>
          <input
            type="prizeName"
            onchange="${(e) => {
              setInventoryName(e.target.value)
            }}"
            id="prizeName"
            name="prizeName"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="input-group">
          <label for="prizeDesc">Prize Description:</label>
          <textarea
            type="prizeDesc"
            id="prizeDesc"
            name="prizeDesc"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="input-group">
          <label for="prizeImage">Prize Image:</label>
          <input
            type="prizeImage"
            onchange="${(e) => {
              setInventoryImage(e.target.value)
            }}"
            id="prizeImage"
            name="prizeImage"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="input-group">
          <label for="prizeAmount">Prize Count:</label>
          <input
            type="prizeAmount"
            id="prizeAmount"
            name="prizeAmount"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <br />
        <button
          id="click"
          onClick=${() =>
            addPrize(
              {
                password: $('#password').val(),
                data: {
                  batch: $('#prizeBatch').val(),
                  name: $('#prizeName').val().trim(),
                  description: $('#prizeDesc').val().trim(),
                  image: $('#prizeImage').val().trim(),
                  count: $('#prizeAmount').val().trim()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Prize</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            deletePrize(
              {
                password: $('#password').val(),
                data: {
                  batch: $('#prizeBatch').val(),
                  name: $('#prizeName').val()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete Prize</button
        ><br /><br />
      </div>

      <div
        id="marketplace-management"
        class="tabcontent"
        style="gap: 2%; width: 100%;"
      >
        <div>
          <h1>Marketplace Management</h1>
          <div class="inventory-item">
            <picture>
              <img src="${marketplaceImage}" class="inventoryImage" />
            </picture>
            <label class="inventoryLabel">${marketplaceName}</label>
          </div>
          <div class="input-group">
            <label for="marketplaceName">Marketplace Item Name:</label>
            <input
              type="marketplaceName"
              onchange="${(e) => {
                setMarketplaceName(e.target.value)
              }}"
              id="marketplaceName"
              name="marketplaceName"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="marketplaceDesc">Marketplace Item Description:</label>
            <textarea
              type="marketplaceDesc"
              id="marketplaceDesc"
              name="marketplaceDesc"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="marketplaceImage">Marketplace Item Image:</label>
            <input
              type="marketplaceImage"
              onchange="${(e) => {
                setMarketplaceImage(e.target.value)
              }}"
              id="marketplaceImage"
              name="marketplaceImage"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="marketplaceSupply">Marketplace Item Max Supply:</label>
            <input
              type="number"
              min="0"
              step="1"
              id="marketplaceSupply"
              name="marketplaceSupply"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="marketplaceInstock">Marketplace Item Instock:</label>
            <input
              type="number"
              min="0"
              step="1"
              id="marketplaceInstock"
              name="marketplaceInstock"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="marketplaceCost">Marketplace Item Fragment Cost:</label>
            <input
              type="number"
              min="0"
              step="1"
              id="marketplaceCost"
              name="marketplaceCost"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div class="input-group">
            <label for="itemStartDate">Item Start Date & Time:</label>
            <input
              type="datetime-local"
              id="itemStartDate"
              name="itemStartDate"
              class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div
            class="input-group"
            style="margin: 1rem 1rem 0 1rem; flex-direction: row; align-items: center;"
          >
            <label for="marketplaceActive" style="margin: 0 1rem 0 0"
              >Active?:</label
            >
            <input
              type="checkbox"
              id="marketplaceActive"
              name="marketplaceActive"
            />
          </div>
          <br />
          <button
            id="click"
            onClick=${async () => {
              const itemStartDate = new Date($('#itemStartDate').val())

              if (!itemStartDate) {
                alert('Please remember to input item start date/time')
                return
              }

              await addMarketplaceItem(
                {
                  password: $('#password').val(),
                  data: {
                    name: $('#marketplaceName').val().trim(),
                    description: $('#marketplaceDesc').val().trim(),
                    image: $('#marketplaceImage').val().trim(),
                    supply: $('#marketplaceSupply').val().trim(),
                    instock: $('#marketplaceInstock').val().trim(),
                    cost: $('#marketplaceCost').val().trim(),
                    active: $('#marketplaceActive').is(':checked'),
                    itemStartDate: itemStartDate.getTime()
                  }
                },
                setError
              )
              handleGetMarketplaceItems()
            }}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add/Update Marketplace Item</button
          ><br /><br />
          <button
            id="click"
            onClick=${() =>
              getPurchases(
                {
                  password: $('#password').val(),
                  data: {
                    name: $('#marketplaceName').val().trim()
                  }
                },
                setError
              )}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Get Selected Item's Purchases</button
          ><br /><br />
          <button
            id="click"
            onClick=${() =>
              getPurchases(
                {
                  password: $('#password').val()
                },
                setError
              )}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Get All Purchases</button
          ><br /><br />
        </div>

        <div style="width: 100%;">
          <h1>All marketplace listings</h1>
          <div
            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;"
          >
            ${marketplaceItems.map(
              (i) =>
                html`<div
                  style="padding: 8px; border: 1px solid ${i.active &&
                  i.itemStartTimestamp &&
                  moment() > moment(i.itemStartTimestamp)
                    ? 'green'
                    : 'red'}; border-radius: 8px; cursor: pointer;"
                  onClick=${() => {
                    setMarketplaceImage(i.image)
                    $('#marketplaceName').val(i.name)
                    $('#marketplaceDesc').val(i.description)
                    $('#marketplaceImage').val(i.image)
                    $('#marketplaceSupply').val(i.supply)
                    $('#marketplaceInstock').val(i.instock)
                    $('#marketplaceCost').val(i.cost)
                    $('#marketplaceActive').prop('checked', i.active)
                  }}
                >
                  <img src="${i.image}" class="inventoryImage" />
                  <h6>Name: <b>${i.name}</b></h6>
                  <p>Description: <b>${i.description}</b></p>
                  <p>Cost: <b>${i.cost}</b></p>
                  <p>Supply: <b>${i.supply}</b></p>
                  <p>Instock: <b>${i.instock}</b></p>
                  <p>
                    Start Datetime:
                    <b
                      >${i.itemStartTimestamp
                        ? moment(i.itemStartTimestamp)
                            .local()
                            .format('Do MMM YY, h:mm:ssa')
                        : 'No Datetime set'}</b
                    >
                  </p>
                  <p>Active: <b>${i.active ? 'True' : 'False'}</b></p>
                </div>`
            )}
          </div>
        </div>
      </div>

      <div id="user-management" class="tabcontent">
        <h1>User Management</h1>
        <div class="input-group">
          <label for="userAddress">Address:</label>
          <input
            type="userAddress"
            id="userAddress"
            name="userAddress"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div class="input-group">
          <label for="fragmentAmount">Fragment Amount:</label>
          <input
            type="fragmentAmount"
            id="fragmentAmount"
            name="fragmentAmount"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <br />
        <button
          id="click"
          onClick=${() =>
            giveFragments(
              {
                password: $('#password').val(),
                data: {
                  address: $('#userAddress').val().trim(),
                  amount: $('#fragmentAmount').val()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Give Fragments</button
        ><br /><br />
        <button
          id="click"
          onClick=${() =>
            getAccounts(
              {
                password: $('#password').val()
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Accounts</button
        ><br /><br />
        <button
          id="click"
          onClick=${() => {
            if (!$('#userAddress').val()) {
              alert('Please enter an address')
              return
            }
            getAddressLogs(
              {
                password: $('#password').val(),
                data: {
                  address: $('#userAddress').val().trim()
                }
              },
              setError
            )
          }}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Address's Logs</button
        ><br /><br />
        <div class="input-group">
          <label for="balanceAmount">Give Balance (Testing only):</label>
          <input
            type="balanceAmount"
            id="balanceAmount"
            name="balanceAmount"
            class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <br /><br />
        <button
          id="click"
          onClick=${() =>
            giveBalance(
              {
                password: $('#password').val(),
                data: {
                  address: $('#userAddress').val().trim(),
                  amount: $('#balanceAmount').val()
                }
              },
              setError
            )}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Give Balance (Testing Only)</button
        ><br /><br />
      </div>
    </div>
  `
}

render(html`<${App} />`, $('#content').get(0))
openDefaultTab('wm-button')
