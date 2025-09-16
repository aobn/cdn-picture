// 图片API服务 - 提供图片外链访问
import { ImageService } from '@/lib/image-service'

export class ImageAPI {
  // 创建图片访问服务器
  static createImageServer() {
    // 由于这是前端应用，我们需要使用Service Worker或其他方式
    // 这里提供一个简化的实现思路
    
    // 注册Service Worker来拦截图片请求
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/image-service-worker.js')
        .then(registration => {
          console.log('图片服务Worker注册成功:', registration)
        })
        .catch(error => {
          console.error('图片服务Worker注册失败:', error)
        })
    }
  }

  // 获取图片的可访问URL
  static getImageUrl(imageId: string): string {
    // 返回当前域名下的图片URL
    const baseUrl = window.location.origin
    return `${baseUrl}/api/images/${imageId}`
  }

  // 处理图片请求（用于Service Worker）
  static async handleImageRequest(imageId: string): Promise<Response> {
    try {
      const imageData = await ImageService.getImageById(imageId)
      
      if (!imageData) {
        return new Response('Image not found', { status: 404 })
      }

      // 将Base64转换为Blob
      const base64Data = imageData.data
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: imageData.mimeType })

      return new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': imageData.mimeType,
          'Content-Length': blob.size.toString(),
          'Cache-Control': 'public, max-age=31536000', // 缓存1年
          'Content-Disposition': `inline; filename="${imageData.filename}"`
        }
      })
    } catch (error) {
      console.error('处理图片请求失败:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }

  // 生成可分享的图片链接
  static generateShareableUrl(imageId: string): string {
    return this.getImageUrl(imageId)
  }
}