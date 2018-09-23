import React from 'react'
import ReactDOM from 'react-dom'

import APP from './app'

const render = (APP) => {
  ReactDOM.render(
    <APP />,
    document.getElementById('app')
  )
}

render(APP)

if (module.hot) {
  module.hot.accept('./app/index', () => { render(APP) })
}
