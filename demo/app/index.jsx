import './index.less'

import React from 'react'

import ScrollOnWebview from '@src/index'

function genData () {
  const a = []
  for (let i = 0; i < 200; i++) {
    a.push(i + 1)
  }

  return a
}

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.scroll = null
    this.state = {
      data: genData(),
      y: 0
    }
  }

  render () {
    return (
      <div className='demo'>
        <h3>ScrollOnWebview</h3>
        <div id='wrap' className='scroll-container'>
          <div className='scroller'>
            <ul>
              {
                this.state.data.map((item, index) => {
                  return <li key={index}>{item}</li>
                })
              }
            </ul>
          </div>
        </div>
        <div className='position'>position: {this.state.y}</div>
      </div>
    )
  }

  componentDidMount () {
    this.scroll = new ScrollOnWebview('#wrap')
    this.scroll.on('scroll', () => {
      console.log('------scroll', this.scroll.y)
      this.setState({
        y: this.scroll.y >> 0
      })
    })
    this.scroll.on('scrollEnd', () => {
      console.log('------scrollEnd', this.scroll.y)
      this.setState({
        y: this.scroll.y >> 0
      })
    })
    this.scroll.on('momentum', ({ y }) => {
      console.log('------momentum', this.scroll.y, 'desty', y)
      this.setState({
        y: this.scroll.y >> 0
      })
    })
  }
}
