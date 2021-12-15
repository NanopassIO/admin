import { h, Component, render } from 'https://unpkg.com/preact@latest?module';
import { useState } from 'https://unpkg.com/preact/hooks/dist/hooks.module.js?module';
import htm from 'https://unpkg.com/htm?module';
import 'https://unpkg.com/jquery';
import { pushBatch } from './functions.js'

const $ = window.$;
const html = htm.bind(h);

function App () {
  const [value, setValue] = useState(0)
  return html`
    <label for="batch">Batch:</label><br/>
    <input type="batch" id="batch" name="batch" /><br/><br/>
    <label for="password">Password:</label><br/>
    <input type="password" id="password" name="password" /><br/><br/>
    <button id="click"
      onClick=${()=> {pushBatch({
        password: $('#password').val(),
        params: {
          batch: $('#batch').val(),
          address: 'test'
        }
      })}}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Click Me
    </button>
  `;
}

render(html`<${App} />`, $('#content').get(0))