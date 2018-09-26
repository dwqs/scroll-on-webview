
/**
 * 本项目改造自：https://github.com/cubiq/iscroll/
 */

import {
  isSupportPassive, getStyleVendor, getPrefixStyle,
  addEvent, removeEvent, getTime, ease,
  isBadAndroid, momentum
} from './utils'

import { requestAnimationFrame, cancelAnimationFrame } from './raf'

const elementStyle = document.createElement('div').style

const defaultOptions = {
  momentum: true, // 弹性缓冲(ios)
  bindToWrapper: true,
  HWCompositing: true, // 硬件加速

  // 缓冲
  bounce: true,
  bounceTime: 0,
  bounceEasing: '',

  // 允许的滚动方向
  scrollX: false,
  scrollY: true,

  // 应用于弹性缓冲的动画持续时间或速度
  deceleration: 0.0006
}
export default class ScrollOnWebview {
  constructor (el, options = {}) {
    this.wrapper = typeof el === 'string' ? document.querySelector(el) : el
    this.scroller = this.wrapper.children[0]
    this.scrollerStyle = this.scroller.style
    this.options = Object.assign({}, {...defaultOptions}, {...options})

    this.x = 0
    this.y = 0
    this.startTime = 0
    this.endTime = 0

    this.events = Object.create(null)

    this.supportsPassive = isSupportPassive()
    this.vendor = getStyleVendor(elementStyle)
    this.hasTransform = !!getPrefixStyle(this.vendor, 'transform')
    this.hasPerspective = getPrefixStyle(this.vendor, 'perspective') in elementStyle
    this.hasTransition = getPrefixStyle(this.vendor, 'transition') in elementStyle
    this.hasTouch = 'ontouchstart' in window

    this.translateZ = this.options.HWCompositing && this.hasPerspective ? ' translateZ(0)' : ''
    this.style = {
      transform: getPrefixStyle(this.vendor, 'transform'),
      transitionTimingFunction: getPrefixStyle(this.vendor, 'transitionTimingFunction'),
      transitionDuration: getPrefixStyle(this.vendor, 'transitionDuration'),
      transitionDelay: getPrefixStyle(this.vendor, 'transitionDelay'),
      transformOrigin: getPrefixStyle(this.vendor, 'transformOrigin'),
      touchAction: getPrefixStyle(this.vendor, 'touchAction')
    }

    this.options.useTransition = !!this.hasTransition
    this.options.useTransform = !!this.hasTransform

    // https://github.com/cubiq/iscroll/issues/1029
    if (!this.options.useTransition && !this.options.useTransform) {
      if (!(/relative|absolute/i).test(this.scrollerStyle.position)) {
        this.scrollerStyle.position = 'relative'
      }
    }

    this._initEvents()
    this.updateSizes()
  }

  on (type, fn) {
    if (!this.events[type]) {
      this.events[type] = []
    }

    this.events[type].push(fn)
  }

  off (type, fn) {
    if (!this.events[type]) {
      return
    }

    const index = this.events[type].indexOf(fn)

    if (index > -1) {
      this.events[type].splice(index, 1)
    }
  }

  getComputedPosition () {
    let matrix = window.getComputedStyle(this.scroller, null)
    let x = 0
    let y = 0

    if (this.options.useTransform) {
      matrix = matrix[this.style.transform].split(')')[0].split(', ')
      x = +(matrix[12] || matrix[4])
      y = +(matrix[13] || matrix[5])
    } else {
      x = +matrix.left.replace(/[^-\d.]/g, '')
      y = +matrix.top.replace(/[^-\d.]/g, '')
    }

    return {x, y}
  }

  updateSizes () {
    this.scroller = this.wrapper.children[0]
    this.scrollerStyle = this.scroller.style

    this.wrapperWidth = this.wrapper.clientWidth
    this.wrapperHeight = this.wrapper.clientHeight

    this.scrollerWidth = this.scroller.offsetWidth
    this.scrollerHeight = this.scroller.offsetHeight

    this.maxScrollX = this.wrapperWidth - this.scrollerWidth
    this.maxScrollY = this.wrapperHeight - this.scrollerHeight

    this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0
    this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0

    if (!this.hasHorizontalScroll) {
      this.maxScrollX = 0
      this.scrollerWidth = this.wrapperWidth
    }

    if (!this.hasVerticalScroll) {
      this.maxScrollY = 0
      this.scrollerHeight = this.wrapperHeight
    }
  }

  scrollTo (x, y, time, easing, shouldAdjust) {
    easing = easing || ease().circular

    this.isInTransition = this.options.useTransition && time > 0

    if (!time || this.options.useTransition) {
      this._transitionTimingFunction(easing.style)
      this._transitionTime(time)
      this._translate(x, y)
      if (shouldAdjust) {
        this._execEvent('scroll')
      }
    } else {
      this._animate(x, y, time, easing.fn)
    }
  }

  _initEvents (remove) {
    const eventType = remove ? removeEvent : addEvent
    const target = this.options.bindToWrapper ? this.wrapper : window

    if (this.hasTouch) {
      eventType(this.wrapper, 'touchstart', this._handleEvent.bind(this))
      eventType(target, 'touchmove', this._handleEvent.bind(this), this.supportsPassive ? {
        capture: false,
        passive: false
      } : false)
      eventType(target, 'touchcancel', this._handleEvent.bind(this))
      eventType(target, 'touchend', this._handleEvent.bind(this))
    }

    if (this.options.useTransition) {
      // tansitionend事件
      eventType(this.scroller, 'transitionend', this._handleEvent.bind(this))
      eventType(this.scroller, 'webkitTransitionEnd', this._handleEvent.bind(this))
      eventType(this.scroller, 'oTransitionEnd', this._handleEvent.bind(this))
      eventType(this.scroller, 'MSTransitionEnd', this._handleEvent.bind(this))
    }
  }

  _start (e) {
    const point = e.touches ? e.touches[0] : e
    this.pointX = point.pageX
    this.pointY = point.pageY

    this.startTime = getTime()
    this.isMoving = false

    // 弹性缓冲还没执行完成
    if (this.options.useTransition && this.isInTransition) {
      this._transitionTime()
      this.isInTransition = false
      const pos = this.getComputedPosition()
      this._translate(Math.round(pos.x), Math.round(pos.y))
      this._execEvent('scrollEnd')
    }

    this.startY = this.y
    this.startX = this.x

    this.distX = 0
    this.distY = 0
  }

  _move (e) {
    // 避免页面的滚动
    e.preventDefault()

    const point = e.touches ? e.touches[0] : e
    const timestamp = getTime()

    let deltaX = point.pageX - this.pointX
    let deltaY = point.pageY - this.pointY

    this.distX += deltaX
    this.distY += deltaY

    this.pointX = point.pageX
    this.pointY = point.pageY

    // We need to move at least 10 pixels for the scrolling to initiate
    if (timestamp - this.endTime > 300 && (Math.abs(this.distX) < 10 && Math.abs(this.distY) < 10)) {
      return
    }

    deltaX = this.hasHorizontalScroll ? deltaX : 0
    deltaY = this.hasVerticalScroll ? deltaY : 0

    let newX = this.x + deltaX
    let newY = this.y + deltaY

    // Slow down if outside of the boundaries
    // 边界检测
    if (newX > 0 || newX < this.maxScrollX) {
      newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX
    }
    if (newY > 0 || newY < this.maxScrollY) {
      newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY
    }

    if (!this.isMoving) {
      this._execEvent('scrollStart')
    }

    this.isMoving = true
    this._translate(newX, newY)

    // 手指在屏幕上的move时间超过300ms
    if (timestamp - this.startTime > 300) {
      this.startTime = timestamp
      this.startX = this.x
      this.startY = this.y
    }

    this._execEvent('scroll')
  }

  _end (e) {
    const duration = getTime() - this.startTime
    let newX = Math.round(this.x)
    let newY = Math.round(this.y)
    let time = 0
    let easing = ''

    this.isInTransition = false
    this.endTime = getTime()

    // reset if we are outside of the boundaries
    if (this._resetPosition(this.options.bounceTime)) {
      // 超出边界了，直接返回
      return
    }

    this.scrollTo(newX, newY)

    // start momentum animation if needed
    if (this.options.momentum && duration < 300) {
      // 弹性缓冲
      const momentumX = this.hasHorizontalScroll ? momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 }
      const momentumY = this.hasVerticalScroll ? momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 }
      newX = momentumX.destination
      newY = momentumY.destination > 0 ? 0 : momentumY.destination < this.maxScrollY ? this.maxScrollY : momentumY.destination
      time = Math.max(momentumX.duration, momentumY.duration)
      this.isInTransition = true
    }

    if (newX !== this.x || newY !== this.y) {
      // change easing function when scroller goes out of the boundaries
      // 缓冲的 transition
      if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
        easing = ease().quadratic
      }
      this._execEvent('momentum', {
        y: newY,
        x: newX
      })
      this.scrollTo(newX, newY, time, easing)
      return
    }

    this._execEvent('scrollEnd')
  }

  _animate (destX, destY, duration, easingFn) {
    const me = this
    const startX = this.x
    const startY = this.y
    const startTime = getTime()
    const destTime = startTime + duration

    function step () {
      let now = getTime()

      if (now >= destTime) {
        me.isAnimating = false
        me._translate(destX, destY)
        if (!this._resetPosition(me.options.bounceTime)) {
          this._execEvent('scrollEnd')
        }
        return
      }

      now = (now - startTime) / duration
      const easing = easingFn(now)
      const newX = (destX - startX) * easing + startX
      const newY = (destY - startY) * easing + startY

      me._translate(newX, newY)

      if (me.isAnimating) {
        me.animateTimer = requestAnimationFrame(step)
      }

      this._execEvent('scroll')
    }

    this.isAnimating = true
    cancelAnimationFrame(this.animateTimer)
    step()
  }

  _transitionEnd (e) {
    if (e.target !== this.scroller || !this.isInTransition) {
      return
    }

    this._transitionTime()
    if (!this._resetPosition(this.options.bounceTime)) {
      this.isInTransition = false
      this._execEvent('scrollEnd')
    }
  }

  _handleEvent (e) {
    switch (e.type) {
      case 'touchstart':
        this._start(e)
        break
      case 'touchmove':
        this._move(e)
        break
      case 'touchend':
      case 'touchcancel':
        this._end(e)
        break
      case 'transitionend':
      case 'webkitTransitionEnd':
      case 'oTransitionEnd':
      case 'MSTransitionEnd':
        this._transitionEnd(e)
        break
      default:
        console.error(`Not supports ${e.type}`)
    }
  }

  _execEvent (type) {
    if (!this.events[type]) {
      return
    }

    const l = this.events[type].length

    if (!l) {
      return
    }

    for (let i = 0; i < l; i++) {
      this.events[type][i].apply(this, [].slice.call(arguments, 1))
    }
  }

  _transitionTimingFunction (easing) {
    this.scrollerStyle[this.style.transitionTimingFunction] = easing
  }

  _transitionTime (time) {
    if (!this.options.useTransition) {
      return
    }

    time = time || 0

    const durationProp = this.style.transitionDuration
    if (!durationProp) {
      return
    }

    this.scrollerStyle[durationProp] = `${time}ms`

    if (!time && isBadAndroid()) {
      this.scrollerStyle[durationProp] = '0.0001ms'
      // remove 0.0001ms
      requestAnimationFrame(() => {
        if (this.scrollerStyle[durationProp] === '0.0001ms') {
          this.scrollerStyle[durationProp] = '0s'
        }
      })
    }
  }

  _resetPosition (time) {
    time = time || 0

    let x = this.x
    let y = this.y

    if (!this.hasHorizontalScroll || this.x > 0) {
      x = 0
    } else if (this.x < this.maxScrollX) {
      x = this.maxScrollX
    }

    if (!this.hasVerticalScroll || this.y > 0) {
      y = 0
    } else if (this.y < this.maxScrollY) {
      y = this.maxScrollY
    }

    if (x === this.x && y === this.y) {
      return false
    }

    this.scrollTo(x, y, time, this.options.bounceEasing)

    return true
  }

  _translate (x, y) {
    if (isNaN(x) || isNaN(y)) {
      return
    }

    if (this.options.useTransform) {
      this.scrollerStyle[this.style.transform] = `translate(0px, ${y}px) ${this.translateZ}`
    } else {
      x = Math.round(x)
      y = Math.round(y)
      this.scrollerStyle.left = `${x}px`
      this.scrollerStyle.top = `${y}px`
    }

    this.x = x
    this.y = y
  }

  destroy () {
    this._initEvents(true)
    this.events = null
  }
}
