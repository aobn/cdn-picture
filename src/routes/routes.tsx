import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import UploadPage from '@/pages/upload-page';
import GalleryPage from '@/pages/gallery-page';
import ImageHandler from '@/components/image-handler';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <UploadPage />
      },
      {
        path: 'upload',
        element: <UploadPage />
      },
      {
        path: 'gallery',
        element: <GalleryPage />
      }
    ]
  },
  // 图片访问路由 - 独立于主应用布局
  {
    path: '/images/:filename',
    element: <ImageHandler />
  }
]);

export default router;