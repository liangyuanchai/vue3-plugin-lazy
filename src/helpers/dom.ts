const inBrowser = typeof window !== 'undefined'

export const hasIntersectionObserver = checkIntersectionObserver()

// 检测浏览器是否支持 IntersectionObserver
function checkIntersectionObserver (): boolean {
  if (inBrowser &&
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in IntersectionObserverEntry.prototype) {
    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/w3c/IntersectionObserver/issues/211
    if (!('isIntersecting' in IntersectionObserverEntry.prototype)) {
      Object.defineProperty(IntersectionObserverEntry.prototype,
        'isIntersecting', {
          get: function (this: IntersectionObserverEntry) {
            return this.intersectionRatio > 0
          }
        })
    }
    return true
  }
  return false
}

const style = (el: HTMLElement, prop: string): string => {
  return getComputedStyle(el).getPropertyValue(prop)
}

// 获取元素 overflow 相关属性值
const overflow = (el: HTMLElement): string => {
  return style(el, 'overflow') + style(el, 'overflow-y') + style(el, 'overflow-x')
}

// 获取最近的可滚动的祖先
export function scrollParent (el: HTMLElement): HTMLElement | Window {
  let parent = el

  while (parent) {
    if (parent === document.body || parent === document.documentElement) {
      break
    }

    if (!parent.parentNode) {
      break
    }

    if (/(scroll|auto)/.test(overflow(parent))) {
      return parent
    }

    parent = parent.parentNode as HTMLElement
  }

  return window
}
