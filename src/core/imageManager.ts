import { ImageManagerOptions, State } from '../types'
import loadImage from '../helpers/loadImage'
import { warn } from '../helpers/debug'

// 图像管理器
export default class ImageManager {
  el: HTMLElement
  parent: HTMLElement | Window
  src: string
  error: string
  loading: string
  cache: Set<string>
  state: State

  constructor (options: ImageManagerOptions) {
    this.el = options.el
    this.parent = options.parent
    this.src = options.src
    this.error = options.error
    this.loading = options.loading
    this.cache = options.cache
    // 在State枚举中 loading = 0
    this.state = State.loading 

    this.render(this.loading)
  }

  // IntersectionObserver观察器被触发时会根据条件调用
  load (next?: Function): void {
    // 代表图片被加载过了
    if (this.state > State.loading) {
      return
    }
    // 缓存中包含当前图像
    if (this.cache.has(this.src)) {
      // 状态变更为loaded
      this.state = State.loaded
      // 替换图片src
      this.render(this.src)
      return
    }
    // 无缓存情况下
    this.renderSrc(next)
  }

  // 判断在不在视口 降级处理
  isInView (): boolean {
    const rect = this.el.getBoundingClientRect()
    return rect.top < window.innerHeight && rect.left < window.innerWidth
  }

  // 只在src变化后更新
  update (src: string): void {
    const currentSrc = this.src
    if (src !== currentSrc) {
      this.src = src
      this.state = State.loading
      this.load()
    }
  }

  // 直接用声明创建image对象 可以理解为直接请求图像 把图像缓存下来
  private renderSrc (next?: Function): void {
    // 加载图像
    loadImage(this.src).then(() => {
      this.state = State.loaded
      this.render(this.src)
      this.cache.add(this.src)
      next && next()
    }).catch((e) => {
      this.state = State.error
      this.render(this.error)
      warn(`load failed with src image(${this.src}) and the error msg is ${e.message}`)
      next && next()
    })
  }

  // 替换src 在不同的状态下加载不同图像
  private render (src: string): void {
    this.el.setAttribute('src', src)
  }
}
