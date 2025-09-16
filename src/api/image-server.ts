// HTTP图片服务器 - 提供真正的HTTP外链访问
export class ImageServer {
  // 启动图片服务器
  static async initialize() {
    // 清理旧的Service Worker
    await this.cleanupServiceWorker()
  }

  // 清理Service Worker
  private static async cleanupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          console.log('已清理Service Worker:', registration.scope)
        }
      } catch (error) {
        console.error('清理Service Worker失败:', error)
      }
    }
  }

  // 生成图片外链URL
  static getImageUrl(imageId: string, extension: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/images/${imageId}.${extension}`
  }
}