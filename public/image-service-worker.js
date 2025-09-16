// 图片服务 Service Worker
// 拦截 /api/images/* 请求并从数据库返回图片

const CACHE_NAME = 'image-cache-v1'
const pendingRequests = new Map()

// 安装Service Worker
self.addEventListener('install', (event) => {
  console.log('图片服务Worker安装中...')
  self.skipWaiting()
})

// 激活Service Worker
self.addEventListener('activate', (event) => {
  console.log('图片服务Worker已激活')
  event.waitUntil(self.clients.claim())
})

// 监听消息（必须在初始化时添加）
self.addEventListener('message', (event) => {
  const { type, messageId, success, imageData, error } = event.data
  
  if (type === 'IMAGE_DATA_RESPONSE') {
    const resolver = pendingRequests.get(messageId)
    if (resolver) {
      pendingRequests.delete(messageId)
      if (success) {
        resolver.resolve(imageData)
      } else {
        resolver.reject(new Error(error || '获取图片失败'))
      }
    }
  }
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // 只处理图片API请求
  if (url.pathname.startsWith('/api/images/')) {
    event.respondWith(handleImageRequest(event.request))
  }
})

// 处理图片请求
async function handleImageRequest(request) {
  try {
    const url = new URL(request.url)
    const imageId = url.pathname.split('/').pop()
    
    if (!imageId) {
      return new Response('Invalid image ID', { status: 400 })
    }

    // 检查缓存
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    // 从数据库获取图片
    const imageData = await getImageFromDatabase(imageId)
    
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

    // 修复：使用ASCII兼容的文件名
    const safeFilename = imageData.filename.replace(/[^\x00-\x7F]/g, "image")

    const response = new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': imageData.mimeType,
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${safeFilename}"`
      }
    })

    // 缓存响应
    await cache.put(request, response.clone())
    
    return response
  } catch (error) {
    console.error('处理图片请求失败:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// 从数据库获取图片数据
async function getImageFromDatabase(imageId) {
  try {
    return new Promise((resolve, reject) => {
      // 向所有客户端发送消息请求图片数据
      self.clients.matchAll().then(clients => {
        if (clients.length === 0) {
          reject(new Error('No active clients'))
          return
        }

        const client = clients[0]
        const messageId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
        
        // 存储Promise解析器
        pendingRequests.set(messageId, { resolve, reject })
        
        // 发送请求
        client.postMessage({
          type: 'GET_IMAGE_DATA',
          imageId: imageId,
          messageId: messageId
        })
        
        // 超时处理
        setTimeout(() => {
          const resolver = pendingRequests.get(messageId)
          if (resolver) {
            pendingRequests.delete(messageId)
            reject(new Error('Request timeout'))
          }
        }, 10000) // 增加超时时间到10秒
      }).catch(error => {
        reject(error)
      })
    })
  } catch (error) {
    console.error('获取图片数据失败:', error)
    throw error
  }
}