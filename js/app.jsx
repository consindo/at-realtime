// css
import style from '../scss/style.scss'

// js
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route } from 'react-router-dom'
import { iOS } from './models/ios.js'
import { UiStore } from './stores/uiStore.js'

import Index from './views/index.jsx'
import Timetable from './views/timetable.jsx'

import injectTapEventPlugin from 'react-tap-event-plugin'
injectTapEventPlugin()

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    )
  }
}
document.addEventListener('DOMContentLoaded', function(event) {
  if (process.env.NODE_ENV === 'production') {
    document.getElementById('app').className = 'production'
    const Runtime = require('offline-plugin/runtime')
    Runtime.install()
  } else {
    console.info('Service Worker is disabled in development.')
  }
  startApp()
})
let startApp = function() {
  window.defaultContent = [
    window.location.pathname,
    (document.querySelector('.default-container') || {}).innerHTML || null
  ]
  ReactDOM.render(<App />, document.getElementById('app'))
}
document.ontouchmove = iOS.touchMoveFix
