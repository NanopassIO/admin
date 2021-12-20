import { h, Component, render } from 'https://unpkg.com/preact@latest?module';
import { useState } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module';
import htm from 'https://unpkg.com/htm?module';
import { preloadBatch } from './functions.js'

const $ = window.$;
const html = htm.bind(h);

function App () {
  const [error, setError] = useState('')
  return html`
    <label for="password">Password:</label><br/>
    <input type="password" id="password" name="password" /><br/><br/>
    <h1>Batch Management</h1>
    <label for="batch">Batch:</label>
    <input type="batch" id="batch" name="batch" class="shadow appearance-none border rounded m-4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
    <button id="click"
      onClick=${async ()=> {
        $.LoadingOverlay('show')
        try {
          await preloadBatch({
            password: $('#password').val(),
            data: {
              batch: $('#batch').val()
            }
          })
        } catch(e) {
          setError(e.message) 
        } finally {
          $.LoadingOverlay('hide')
        }
      }}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Preload Batch
    </button><br/><br/>
    <span style="color: red">${error}</span>
  `;
}

render(html`<${App} />`, $('#content').get(0))