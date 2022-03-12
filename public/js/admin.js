import { h, render } from 'https://unpkg.com/preact@latest?module'
import { useState, useEffect } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module'
import htm from 'https://unpkg.com/htm?module'
import {
  preloadBatch, getBatch, activateBatch, getPrizeList,
  addPrize, deletePrize, getActiveBatch, overrideActiveBatch,
  giveFragments, getAccounts, winners, giveBalance
} from './functions.js'
import { tabFunction, openDefaultTab } from './tabs.js'

const $ = window.$
const html = htm.bind(h)

const lastWeekBatch = batch => {
  return batch.split('-').map(b => {
    if (b === 'batch') {
      return b
    }

    return `${parseInt(b) - 1}`
  }).join('-')
}

function App () {
  const [error, setError] = useState('')
  const [activeBatch, setActiveBatch] = useState('')
  const [inventoryImage, setInventoryImage] = useState('')
  const [inventoryName, setInventoryName] = useState('')
  useEffect(() => {
    getActiveBatch(setError)
      .then(settings => {
        setActiveBatch(settings.batch)
      })
  }, [activeBatch])
  return html`
    <label for="password">Password:</label>
    <input value="" type="password" id="password" name="password" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/><br/>
    <span style="color: red">${error}</span>

    <div class="admin-container">
      <div class="tab">
        <button class="tablinks" id="wm-button"
          onClick=${() => tabFunction('wm-button', 'winner-management')}>
          Winner Management
        </button>
        <button class="tablinks" id="bm-button"
          onClick=${() => tabFunction('bm-button', 'batch-management')}>
          Batch Management
        </button>
        <button class="tablinks" id="pm-button"
          onClick=${() => tabFunction('pm-button', 'prize-management')}>
          Prize Management
        </button>
        <button class="tablinks" id="um-button"
          onClick=${() => tabFunction('um-button', 'user-management')}>
          User Management
        </button>
      </div>

      <div id="winner-management" class="tabcontent">
        <h1>Winner Management</h1><br/>
        <div>Active Batch: ${activeBatch}</div>
        <div>Last Weeks Batch: ${lastWeekBatch(activeBatch)}</div><br/>    
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              }, 'wl', setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get WL winners for this week
        </button><br/><br/>
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              }, 'nft', setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get NFT winners for this week
        </button><br/><br/>
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: activeBatch
                }
              }, null, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get all winners for this week
        </button><br/><br/>
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              }, 'wl', setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get WL winners for last week
        </button><br/><br/>
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              }, 'nft', setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get NFT winners for last week
        </button><br/><br/>
        <button id="click"
          onClick=${() => winners({
                password: $('#password').val(),
                data: {
                  batch: lastWeekBatch(activeBatch)
                }
              }, null, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get all winners for last week
        </button><br/><br/>
      </div>

      <div id="batch-management" class="tabcontent">
        <h1>Batch Management</h1>
        <div>Active Batch: ${activeBatch}</div>
        <div class="input-group">
          <label for="batch">Batch:</label>
          <input type="batch" id="batch" name="batch" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/><br/>
        </div>
        <button id="click"
          onClick=${() => preloadBatch({
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Preload Batch
        </button><br/><br/>
        <button id="click"
          onClick=${() => activateBatch({
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Randomize and Activate Batch
        </button><br/><br/>
        <button id="click"
          onClick=${() => overrideActiveBatch({
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Override Active Batch
        </button><br/><br/>
        <button id="click"
          onClick=${() => getBatch({
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get Batch
        </button><br/><br/>
        <button id="click"
          onClick=${() => getPrizeList({
                password: $('#password').val(),
                data: {
                  batch: $('#batch').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get Prize List
        </button><br/><br/>
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
          <input type="prizeBatch" id="prizeBatch" name="prizeBatch" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div class="input-group">
          <label for="prizeName">Prize Name:</label>
          <input type="prizeName" onchange="${(e) => {
            setInventoryName(e.target.value)
          }}" id="prizeName" name="prizeName" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div class="input-group">
          <label for="prizeDesc">Prize Description:</label>
          <textarea type="prizeDesc" id="prizeDesc" name="prizeDesc" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div class="input-group">
          <label for="prizeImage">Prize Image:</label>
          <input type="prizeImage" onchange="${(e) => {
            setInventoryImage(e.target.value)
          }}" id="prizeImage" name="prizeImage" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div class="input-group">
          <label for="prizeAmount">Prize Count:</label>
          <input type="prizeAmount" id="prizeAmount" name="prizeAmount" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <br/>
        <button id="click"
          onClick=${() => addPrize({
                password: $('#password').val(),
                data: {
                  batch: $('#prizeBatch').val(),
                  name: $('#prizeName').val().trim(),
                  description: $('#prizeDesc').val().trim(),
                  image: $('#prizeImage').val().trim(),
                  count: $('#prizeAmount').val().trim()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add Prize
        </button><br/><br/>
        <button id="click"
          onClick=${() => deletePrize({
                password: $('#password').val(),
                data: {
                  batch: $('#prizeBatch').val(),
                  name: $('#prizeName').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Delete Prize
        </button><br/><br/>
      </div>

      <div id="user-management" class="tabcontent">
        <h1>User Management</h1>
        <div class="input-group">
          <label for="userAddress">Address:</label>
          <input type="userAddress" id="userAddress" name="userAddress" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div class="input-group">
          <label for="fragmentAmount">Fragment Amount:</label>
          <input type="fragmentAmount" id="fragmentAmount" name="fragmentAmount" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <br/>
        <button id="click"
          onClick=${() => giveFragments({
                password: $('#password').val(),
                data: {
                  address: $('#userAddress').val().trim(),
                  amount: $('#fragmentAmount').val()
                }
              }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Give Fragments
        </button><br/><br/>
        <button id="click"
          onClick=${() => getAccounts({
                password: $('#password').val()
          }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Get Accounts
        </button><br/><br/>
        <div class="input-group">
          <label for="balanceAmount">Give Balance (Testing only):</label>
          <input type="balanceAmount" id="balanceAmount" name="balanceAmount" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
        </div><br/><br/>
        <button id="click"
          onClick=${() => giveBalance({
                password: $('#password').val(),
                data: {
                  address: $('#userAddress').val().trim(),
                  amount: $('#balanceAmount').val()
                }
          }, setError)}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Give Balance (Testing Only)
        </button><br/><br/>
      </div>
    </div>
    
    
    
  `
}

render(html`<${App} />`, $('#content').get(0))
openDefaultTab('wm-button')
