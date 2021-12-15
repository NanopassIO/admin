import { h, Component, render } from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';
import 'https://unpkg.com/jquery';
const $ = window.$;
const html = htm.bind(h);

let state = {}

function App () {
  return html`<h1>Nanopass Admin Panel</h1>
  
  
  `;
}

function renderAll() {
  render(html`<${App} />`, $('body').get(0));
}

renderAll()

const myTodo = {
  title: 'My todo title',
  completed: false,
}

async function test() {
  console.log("test")
  console.log(await fetch('/.netlify/functions/crypto', {
      body: JSON.stringify(myTodo),
      method: 'POST'
  }))
}