import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ControlRoom from './pages/ControlRoom';
import Analytics from './pages/Analytics';
import { UserAccountsProvider } from './hooks/useUserAccounts';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <UserAccountsProvider>
      <div className="scanline-effect min-h-screen pb-16">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/control-room" element={<ControlRoom />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
        <Footer />
      </div>
    </UserAccountsProvider>
  );
}

export default App;
