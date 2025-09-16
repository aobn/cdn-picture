// Service Worker 通信桥接
import { ImageService } from './image-service'

export class ImageWorkerBridge {
  private static initialized = false

  // 初始化Service Worker通信
  static async initialize() {
    if (this.initialized) return

    // 注册Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/image-service-worker.js')
        console.log('图片服务Worker注册成功:', registration)
        
        // 监听Service Worker消息
        navigator.serviceWorker.addEventListener('message', this.handleWorkerMessage)
        
        this.initialized = true
      } catch (error) {
        console.error('图片服务Worker注册失败:', error)
      }
    }
  }

  // 处理Service Worker消息
  private static handleWorkerMessage = async (event: MessageEvent) => {
    const { type, imageId, messageId } = event.data

    if (type === 'GET_IMAGE_DATA') {
      try {
        console.log('收到Service Worker图片请求:', imageId)
        
        // 从数据库获取图片数据
        const imageData = await ImageService.getImageById(imageId)
        
        console.log('获取图片数据结果:', imageData ? '成功' : '未找到')
        
        // 发送响应给Service Worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'IMAGE_DATA_RESPONSE',
            messageId: messageId,
            success: !!imageData,
            imageData: imageData
          })
        }
      } catch (error) {
        console.error('获取图片数据失败:', error)
        
        // 发送错误响应
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'IMAGE_DATA_RESPONSE',
            messageId: messageId,
            success: false,
            error: error instanceof Error ? error.message : '获取图片失败'
          })
        }
      }
    }
  }

  // 获取图片的外链URL
  static getImageUrl(imageId: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/api/images/${imageId}`
  }

  // 预热图片缓存
  static async preloadImage(imageId: string): Promise<boolean> {
    try {
      const url = this.getImageUrl(imageId)
      const response = await fetch(url)
      return response.ok
    } catch (error) {
      console.error('预加载图片失败:', error)
      return false
    }
  }
}