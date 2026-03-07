import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import PrivacyPage from './pages/PrivacyPage';
import LicensingPage from './pages/LicensingPage';

// Optional: A component to redirect authenticated users away from landing/login pages
const AuthRedirect = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/app" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={
                        <AuthRedirect>
                            <LandingPage />
                        </AuthRedirect>
                    } />
                    <Route path="/login" element={
                        <AuthRedirect>
                            <LoginPage />
                        </AuthRedirect>
                    } />
                    <Route path="/app" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/licensing" element={<LicensingPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
