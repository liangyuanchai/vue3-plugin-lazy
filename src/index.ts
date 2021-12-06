import { App } from 'vue'
import { LazyOptions } from './types'
import Lazy from './core/lazy'

const lazyPlugin = {
  // 注册插件 插件会注册全局指令
  install (app: App, options: LazyOptions) {
    const lazy = new Lazy(options)

    // 注册全局指令
    // 指令是具有一组生命周期的钩子：
    // 在绑定元素的 attribute 或事件监听器被应用之前调用
    app.directive('lazy', {
      // 绑定元素的父组件被挂载时调用
      mounted: lazy.add.bind(lazy),
      // 在包含组件的 VNode 及其子组件的 VNode 更新之后调用
      updated: lazy.update.bind(lazy),
      // 卸载绑定元素的父组件时调用
      unmounted: lazy.remove.bind(lazy)
    })
  }
}

export default lazyPlugin
