import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import UploadPage from '@/pages/upload-page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <UploadPage />
      }
    ]
  }
]);

export default router;