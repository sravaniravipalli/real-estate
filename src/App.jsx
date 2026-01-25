import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { router } from './routes/routes/Routes';

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router}/>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
