import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import BlogSecurity from './pages/BlogSecurity';
import BlogPerformance from './pages/BlogPerformance';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Account from './pages/Account';
import CustomDesign from './pages/CustomDesign';

export default function App() {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/blog/security" element={<BlogSecurity />} />
            <Route path="/blog/performance" element={<BlogPerformance />} />
            <Route path="/legal" element={<Legal />} />

            {/* Signed-in only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute redirectTo="/signup">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/custom-design"
              element={
                <ProtectedRoute>
                  <CustomDesign />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeContextProvider>
  );
}
