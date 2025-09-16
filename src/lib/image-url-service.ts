// 图片URL服务 - 简化版本，不使用Service Worker
import { ImageService } from './image-service'

export class ImageUrlService {
  private static imageCache = new Map<string, string>()

  // 生成图片的Blob URL
  static async getImageBlobUrl(imageId: string): Promise<string | null> {
    try {
      // 检查缓存
      if (this.imageCache.has(imageId)) {
        return this.imageCache.get(imageId)!
      }

      // 从数据库获取图片数据
      const imageData = await ImageService.getImageById(imageId)
      if (!imageData) {
        return null
      }

      // 将Base64转换为Blob
      const base64Data = imageData.data
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: imageData.mimeType })
      const blobUrl = URL.createObjectURL(blob)

      // 缓存URL
      this.imageCache.set(imageId, blobUrl)

      return blobUrl
    } catch (error) {
      console.error('生成图片URL失败:', error)
      return null
    }
  }

  // 获取图片的Data URL（用于外链分享）
  static async getImageDataUrl(imageId: string): Promise<string | null> {
    try {
      const imageData = await ImageService.getImageById(imageId)
      if (!imageData) {
        return null
      }

      return ImageService.createDataUrl(imageData.data, imageData.mimeType)
    } catch (error) {
      console.error('生成图片Data URL失败:', error)
      return null
    }
  }

  // 清理缓存
  static clearCache() {
    for (const url of this.imageCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.imageCache.clear()
  }

  // 生成可分享的外链（使用Data URL）
  static async getShareableUrl(imageId: string): Promise<string | null> {
    return await this.getImageDataUrl(imageId)
  }
}