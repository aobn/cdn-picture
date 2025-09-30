import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import HelloWorld from '@/pages/HelloWorld';
import ImageUploadPage from '@/pages/ImageUploadPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HelloWorld />
      },
      {
        path: 'upload',
        element: <ImageUploadPage />
      }
    ]
  }
]);

export default router;