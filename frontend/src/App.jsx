/**
 * EdgeSeeker App - Intelligence Analysis System
 * Route-based language switching with responsive design
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntelligencePage from './pages/IntelligencePage';
import MobileIntelligencePage from './pages/MobileIntelligencePage';
import './styles/mobile-intelligence.css';

// Custom hook for responsive detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// Responsive page wrapper
function ResponsivePage({ lang }) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileIntelligencePage lang={lang} />;
  }
  
  return <IntelligencePage lang={lang} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Language-prefixed routes */}
        <Route path="/en" element={<ResponsivePage lang="en" />} />
        <Route path="/zh" element={<ResponsivePage lang="zh" />} />
        {/* Default redirect to English */}
        <Route path="/" element={<Navigate to="/en" replace />} />
        <Route path="*" element={<Navigate to="/en" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
