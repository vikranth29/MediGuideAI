import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { ReportAnalysis } from './pages/ReportAnalysis';
import { ImageAnalysis } from './pages/ImageAnalysis';
import { Hospitals } from './pages/Hospitals';
import { Privacy } from './pages/Privacy';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthenticatedDashboard } from './pages/AuthenticatedDashboard';
import { SymptomChecker } from './pages/SymptomChecker';
import { Medicine } from './pages/Medicine';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Emergency } from './pages/Emergency';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';

export function App() {
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
          {showEmergencyBanner && (
            <EmergencyBanner onDismiss={() => setShowEmergencyBanner(false)} />
          )}
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/reports" element={<ReportAnalysis />} />
              <Route path="/image-analysis" element={<ImageAnalysis />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/medicine" element={<Medicine />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<AuthenticatedDashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
