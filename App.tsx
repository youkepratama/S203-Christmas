import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackgroundAudio from './components/BackgroundAudio';
import Home from './pages/Home';
import RSVP from './pages/RSVP';
import Menu from './pages/Menu';
import Messages from './pages/Messages';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-surface">
        <BackgroundAudio />
        <Navbar />
        <main className="flex-grow w-full max-w-7xl mx-auto flex flex-col items-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rsvp" element={<RSVP />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
