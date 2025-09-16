// 图片处理组件 - 处理 /images/* 路由
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ImageService } from '@/lib/image-service'

const ImageHandler: React.FC = () => {
  const { filename } = useParams<{ filename: string }>()
  const [imageData, setImageData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadImage = async () => {
      if (!filename) {
        setError('文件名无效')
        return
      }

      try {
        // 从文件名中提取UUID
        const imageId = filename.split('.')[0]
        const image = await ImageService.getImageById(imageId)
        
        if (image) {
          // 创建Base64数据URL
          const dataUrl = ImageService.createDataUrl(image.data, image.mimeType)
          setImageData(dataUrl)
        } else {
          setError('图片不存在')
        }
      } catch (err) {
        console.error('加载图片失败:', err)
        setError('加载图片失败')
      }
    }

    loadImage()
  }, [filename])

  // 如果有图片数据，直接显示图片
  if (imageData) {
    return (
      <div style={{ 
        margin: 0, 
        padding: 0, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#000'
      }}>
        <img 
          src={imageData} 
          alt={filename}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100vh', 
            objectFit: 'contain' 
          }}
        />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ 
        margin: 0, 
        padding: '2rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1>404 - 图片不存在</h1>
        <p>{error}</p>
      </div>
    )
  }

  // 加载状态
  return (
    <div style={{ 
      margin: 0, 
      padding: '2rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <p>加载中...</p>
    </div>
  )
}

export default ImageHandler