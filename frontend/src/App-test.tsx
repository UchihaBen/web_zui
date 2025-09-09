import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Friends from './components/Friends';
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <>
                <Navbar />
                <Dashboard />
              </>
            } />
            <Route path="/messages" element={
              <>
                <Navbar />
                <Messages />
              </>
            } />
            <Route path="/profile/:userId?" element={
              <>
                <Navbar />
                <Profile />
              </>
            } />
            <Route path="/friends" element={
              <>
                <Navbar />
                <Friends />
              </>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
