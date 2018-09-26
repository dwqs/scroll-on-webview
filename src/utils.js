export const isSupportPassive = () => {
  let supportsPassive = false
  try {
    const opts = {}
    Object.defineProperty(opts, 'passive', {
      get () {
        supportsPassive = true
      }
    })
    window.addEventListener('test-passive', null, opts)
  } catch (e) {}
  return supportsPassive
}

export const getStyleVendor = (elementStyle) => {
  const vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT']

  for (let i = 0; i < vendors.length; i++) {
    const transform = vendors[i] + 'ransform'
    if (transform in elementStyle) {
      return vendors[i].substr(0, vendors[i].length - 1)
    }
  }

  return false
}

export const getPrefixStyle = (vendor, style) => {
  if (vendor === false) {
    return false
  }

  if (vendor === '') {
    return style
  }

  return `${vendor}${style.charAt(0).toUpperCase()}${style.substr(1)}`
}

export const getTime = () => Date.now() || new Date().getTime()

export const addEvent = (el, type, fn, opts = false) => {
  el.addEventListener(type, fn, opts)
}

export const removeEvent = (el, type, fn, opts = false) => {
  el.removeEventListener(type, fn, opts)
}

/*
This should find all Android browsers lower than build 535.19 (both stock browser and webview)
- galaxy S2 is ok
  - 2.3.6 : `AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`
  - 4.0.4 : `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
  - galaxy S3 is badAndroid (stock brower, webview)
    `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
  - galaxy S4 is badAndroid (stock brower, webview)
    `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
  - galaxy S5 is OK
    `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
  - galaxy S6 is OK
    `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
*/
export const isBadAndroid = () => {
  const ua = window.navigator.userAgent
  // Android browser is not a chrome browser.
  if (/Android/.test(ua) && !(/Chrome\/\d/.test(ua))) {
    const safariVersion = ua.match(/Safari\/(\d+.\d)/)
    if (safariVersion && typeof safariVersion === 'object' && safariVersion.length >= 2) {
      return parseFloat(safariVersion[1]) < 535.19
    } else {
      return true
    }
  } else {
    return false
  }
}

export const ease = () => {
  // trasition ease function
  return {
    quadratic: {
      style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fn: function (k) {
        return k * (2 - k)
      }
    },
    circular: {
      // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
      style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',
      fn: function (k) {
        return Math.sqrt(1 - (--k * k))
      }
    },
    back: {
      style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      fn: function (k) {
        const b = 4
        return (k = k - 1) * k * ((b + 1) * k + b) + 1
      }
    },
    bounce: {
      style: '',
      fn: function (k) {
        if ((k /= 1) < (1 / 2.75)) {
          return 7.5625 * k * k
        } else if (k < (2 / 2.75)) {
          return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75
        } else if (k < (2.5 / 2.75)) {
          return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375
        } else {
          return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375
        }
      }
    },
    elastic: {
      style: '',
      fn: function (k) {
        const f = 0.22
        const e = 0.4

        if (k === 0) {
          return 0
        }
        if (k === 1) {
          return 1
        }

        return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1)
      }
    }
  }
}

// 弹性缓存动量
export const momentum = (current, start, time, lowerMargin, wrapperSize, deceleration) => {
  let distance = current - start
  const speed = Math.abs(distance) / time

  let destination = 0
  let duration = 0

  deceleration = deceleration === undefined ? 0.0006 : deceleration
  destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1)
  duration = speed / deceleration

  if (destination < lowerMargin) {
    destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin
    distance = Math.abs(destination - current)
    duration = distance / speed
  } else if (destination > 0) {
    destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0
    distance = Math.abs(current) + destination
    duration = distance / speed
  }

  return {
    destination: Math.round(destination),
    duration
  }
}
