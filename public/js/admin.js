import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useState, useEffect } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module';
import htm from 'https://unpkg.com/htm?module';
import { preloadBatch, getBatch, activateBatch, getPrizeList, 
  addPrize, deletePrize, getActiveBatch, overrideActiveBatch, 
  giveFragments, getAccounts } from './functions.js'
import { toChecksumAddress } from 'ethereum-checksum-address'
  

const $ = window.$;
const html = htm.bind(h);

function App () {
  const [error, setError] = useState('')
  const [activeBatch, setActiveBatch] = useState('')
  const [inventoryImage, setInventoryImage] = useState('')
  const [inventoryName, setInventoryName] = useState('')
  useEffect(() => {
    getActiveBatch(setError)
       .then(settings => {
        setActiveBatch(settings.batch);
       });
  }, [activeBatch]);
  return html`
    <label for="password">Password:</label>
    <input value="" type="password" id="password" name="password" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/><br/>
    <span style="color: red">${error}</span>
    <h1>Batch Management</h1>
    <div>Active Batch: ${activeBatch}</div>
    <label for="batch">Batch:</label>
    <input type="batch" id="batch" name="batch" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/><br/>
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
    <h1>Prize Management</h1>
    <div class="inventory-item">
      <picture>
        <img src="${inventoryImage}" class="inventoryImage" />
      </picture>
      <label class="inventoryLabel">${inventoryName}</label>
    </div>
    <label for="prizeBatch">Batch:</label>
    <input type="prizeBatch" id="prizeBatch" name="prizeBatch" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <label for="prizeName">Prize Name:</label>
    <input type="prizeName" onchange="${(e)=>{
      setInventoryName(e.target.value)
    }}" id="prizeName" name="prizeName" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <label for="prizeDesc">Prize Description:</label>
    <input type="prizeDesc" id="prizeDesc" name="prizeDesc" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <label for="prizeImage">Prize Image:</label>
    <input type="prizeImage" onchange="${(e)=>{
      setInventoryImage(e.target.value)
    }}" id="prizeImage" name="prizeImage" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <label for="prizeAmount">Prize Count:</label>
    <input type="prizeAmount" id="prizeAmount" name="prizeAmount" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/><br/>
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
    <h1>User Management</h1>
    <label for="userAddress">Address:</label>
    <input type="userAddress" id="userAddress" name="userAddress" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <label for="fragmentAmount">Fragment Amount:</label>
    <input type="fragmentAmount" id="fragmentAmount" name="fragmentAmount" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/><br/>
    <button id="click"
      onClick=${() => giveFragments({
            password: $('#password').val(),
            data: {
              address: toChecksumAddress($('#userAddress').val()),
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
  `;
}

render(html`<${App} />`, $('#content').get(0))