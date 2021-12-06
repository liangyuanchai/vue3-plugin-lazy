import { DirectiveBinding } from 'vue'
import { LazyOptions, State, Target } from '../types'
import { hasIntersectionObserver, scrollParent } from '../helpers/dom'
import ImageManager from './imageManager'
import { throttle } from '../helpers/util'

// 默认图像
const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const events = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove', 'transitioncancel']

const THROTTLE_DELAY = 300

// Lazy 类 在插件被注册后创建一个实例 用于处理指令中图像操作
export default class Lazy {
  error: string
  loading: string
  cache: Set<string>
  managerQueue: ImageManager[]
  observer?: IntersectionObserver
  targetQueue?: Target[]
  throttleLazyHandler: Function

  constructor (options: LazyOptions) {
    this.error = options.error || DEFAULT_URL
    this.loading = options.loading || DEFAULT_URL

    // 缓存列表 
    this.cache = new Set()
    // 图像管理器列表
    this.managerQueue = []
    // 节流函数
    this.throttleLazyHandler = throttle(this.lazyHandler.bind(this), THROTTLE_DELAY)
    // 初始化 指创建观察器实例
    this.init()
  }

  // 添加 lazy 能力 在绑定元素的父组件被挂载时调用
  // 指令钩子传递了这些参数：
  //   el 指令绑定到的元素。这可用于直接操作 DOM。
  //   binding 包含以下 property 的对象。
  //     instance：使用指令的组件实例。
  //     value：传递给指令的值。例如，在 v-my-directive="1 + 1" 中，该值为 2。
  //     oldValue：先前的值，仅在 beforeUpdate 和 updated 中可用。值是否已更改都可用。
  //     arg：参数传递给指令 (如果有)。例如在 v-my-directive:foo 中，arg 为 "foo"。
  //     modifiers：包含修饰符 (如果有) 的对象。例如在 v-my-directive.foo.bar 中，修饰符对象为 {foo: true，bar: true}。
  //     dir：一个对象，在注册指令时作为参数传递。
  add (el: HTMLElement, binding: DirectiveBinding): void {
    // 图像真实地址
    const src = binding.value
    // 图像最近的可滚动的祖先
    const parent = scrollParent(el)
    // 创建图像管理器
    const manager = new ImageManager({
      el,
      parent,
      src,
      error: this.error,
      loading: this.loading,
      cache: this.cache
    })
    // 存储生成的管理器 Lazy实例是全局单例
    this.managerQueue.push(manager)

    if (hasIntersectionObserver) {
      // 使用观察器实例观察当前图像
      this.observer!.observe(el)
    } else {
      // 不支持的浏览器做降级处理
      this.addListenerTarget(parent)
      this.addListenerTarget(window)
      this.throttleLazyHandler()
    }
  }

  // 更新图像管理器 在包含组件的 VNode 及其子组件的 VNode 更新之后调用
  update (el: HTMLElement, binding: DirectiveBinding): void {
    const src = binding.value
    const manager = this.managerQueue.find((manager) => {
      return manager.el === el
    })
    if (manager) {
      manager.update(src)
    }
  }

  // 删除图像管理器 卸载绑定元素的父组件时调用
  remove (el: HTMLElement): void {
    const manager = this.managerQueue.find((manager) => {
      return manager.el === el
    })
    if (manager) {
      this.removeManager(manager)
    }
  }

  private init (): void {
    // 初始化 IntersectionObserver 
    // 提供了一种异步观察目标元素与其祖先元素或顶级文档视窗(viewport)交叉状态的方法
    if (hasIntersectionObserver) {
      this.initIntersectionObserver()
    } else {
      this.targetQueue = []
    }
  }

  private initIntersectionObserver (): void {
    // 创建观察器实例
    this.observer = new IntersectionObserver((entries) => {
      // entries是一个数组，每个成员都是一个IntersectionObserverEntry对象。
      // 举例来说，如果同时有两个被观察的对象的可见性发生变化，entries数组就会有两个成员。
      entries.forEach((entry) => {
        // 当前元素可见
        if (entry.isIntersecting) {
          // 从图像管理器列表中查找当前图像的
          const manager = this.managerQueue.find((manager) => {
            return manager.el === entry.target
          })
          // 如果有图像管理器
          if (manager) {
            // 如果图像状态已经被加载 移除管理器
            if (manager.state === State.loaded) {
              this.removeManager(manager)
              return
            }
            // 加载图像
            manager.load()
          }
        }
      })
    }, {
      // rootMargin定义根元素的margin，
      // 用来扩展或缩小rootBounds这个矩形的大小，
      // 从而影响intersectionRect交叉区域的大小。
      // 它使用CSS的定义方法，比如10px 20px 30px 40px，表示 top、right、bottom 和 left 四个方向的值。
      rootMargin: '0px',
      // threshold属性决定了什么时候触发回调函数。
      // 它是一个数组，每个成员都是一个门槛值，默认为[0]，
      // 即交叉比例（intersectionRatio）达到0时触发回调函数。
      threshold: [0]
    })
  }

  private addListenerTarget (el: HTMLElement | Window): void {
    let target = this.targetQueue!.find((target) => {
      return target.el === el
    })

    if (!target) {
      target = {
        el,
        ref: 1
      }
      this.targetQueue!.push(target)
      this.addListener(el)
    } else {
      target.ref++
    }
  }

  private removeListenerTarget (el: HTMLElement | Window): void {
    this.targetQueue!.some((target, index) => {
      if (el === target.el) {
        target.ref--
        if (!target.ref) {
          this.removeListener(el)
          this.targetQueue!.splice(index, 1)
        }
        return true
      }
      return false
    })
  }

  private addListener (el: HTMLElement | Window): void {
    events.forEach((event) => {
      el.addEventListener(event, this.throttleLazyHandler as EventListenerOrEventListenerObject, {
        passive: true,
        capture: false
      })
    })
  }

  private removeListener (el: HTMLElement | Window): void {
    events.forEach((event) => {
      el.removeEventListener(event, this.throttleLazyHandler as EventListenerOrEventListenerObject)
    })
  }

  private lazyHandler (e: Event): void {
    for (let i = this.managerQueue.length - 1; i >= 0; i--) {
      const manager = this.managerQueue[i]
      if (manager.isInView()) {
        if (manager.state === State.loaded) {
          this.removeManager(manager)
          return
        }
        manager.load()
      }
    }
  }

  // 移除单个图像管理器 
  private removeManager (manager: ImageManager): void {
    // 数组中删除
    const index = this.managerQueue.indexOf(manager)
    if (index > -1) {
      this.managerQueue.splice(index, 1)
    }
    if (this.observer) {
      // 观察器停止观察
      this.observer.unobserve(manager.el)
    } else {
      this.removeListenerTarget(manager.parent)
      this.removeListenerTarget(window)
    }
  }
}
