![npm-version](https://img.shields.io/npm/v/@dwqs/scroll-on-webview.svg) ![license](https://img.shields.io/github/license/dwqs/scroll-on-webview.svg) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

> 此项目产生的缘由是因为 [scroll 事件在 iOS UIWebViews 上的延迟触发](https://developer.mozilla.org/en-US/docs/Web/Events/scroll#Browser_compatibility), 基于 iscroll 改造

## scroll-on-webview
Scroll on webview

## Basic Usage
Install the pkg with npm or yarn:

```shell
npm i --save @dwqs/scroll-on-webview

// or

yarn add @dwqs/scroll-on-webview
```

Use in the component:

```js
import ScrollOnWebview from '@dwqs/scroll-on-webview'

export default class Hello extends React.Component {
  render () {
    return (
      <div id='hello'>Scroll Container</div>
    )
  }

  componentDidMount () {
    this.scroller = new ScrollOnWebview('#hello', {
      // your options
    })
  }
}
```

## Options
> type格式：类型:默认值

|name|type|desc|
|:--:|:--:|:--:|
|momentum|bool:true|是否增加弹性缓冲|
|bindToWrapper|bool:true|是否将事件绑定在 Scroll Container 元素上|
|HWCompositing|bool:true|是否启用硬件加速|
|bounce|bool:true|滚动到边界时是否添加缓冲动画|
|bounceTime|number:300|缓冲动画的持续时间, 单位 ms|
|bounceEasing|string:''|缓冲动画的缓冲函数，内置可选值：quadratic/circular/back/bounce/elastic|
|scrollX|bool:false|是否允许在X方向上滚动|
|scrollY|bool:true|是否允许在Y方向上滚动|

## Scroller 实例

* `scroller.x` / `scroller.y`：当前的位置
* `scroller.on` / `scroller.off`：自定义事件的监听和解绑

```
myScroll = new ScrollOnWebview('#hello');
myScroll.on('scrollEnd', doSomething);
```

* `scrollStart`：开始滚动时触发
* `scroll`：滚动时触发
* `scrollEnd`：滚动结束时触发
* `momentum`：执行弹性缓冲时触发

## LICENSE
MIT
