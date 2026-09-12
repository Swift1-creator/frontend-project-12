import { Navigate, Route, Routes } from 'react-router-dom';

import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './components/SignupPage.jsx';
import Header from './components/Header.jsx';
import { getToken } from './auth.js';

const ProtectedRoute = ({ children }) => {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => (
  <>
    <Header />

    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        )}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  </>
);


export default App;