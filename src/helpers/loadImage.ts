// 加载图象
export default function loadImage (src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = function () {
      resolve('onload')
      dispose()
    }

    image.onerror = function (e) {
      reject(e)
      dispose()
    }

    image.src = src

    // 将图象的 onload onerror 属性重置 
    function dispose () {
      image.onload = image.onerror = null
    }
  })
}
