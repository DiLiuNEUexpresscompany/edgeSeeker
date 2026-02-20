/**
 * EdgeSeeker App - Intelligence Analysis System
 * Route-based language switching
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntelligencePage from './pages/IntelligencePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Language-prefixed routes */}
        <Route path="/en" element={<IntelligencePage lang="en" />} />
        <Route path="/zh" element={<IntelligencePage lang="zh" />} />
        {/* Default redirect to English */}
        <Route path="/" element={<Navigate to="/en" replace />} />
        <Route path="*" element={<Navigate to="/en" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
