import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Home = () => {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {
    // Test backend connection
    const testBackend = async () => {
      try {
        const healthData = await api.health();
        setBackendStatus('connected ✅');
        setBackendData(healthData);
      } catch (error) {
        setBackendStatus('disconnected ❌');
        console.error('Backend connection failed:', error);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎮 Game Backlog Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Manage your video game backlog, track progress, and maintain ratings/reviews.
          </p>
          
          {/* Backend Status */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Backend Status: <span className="text-blue-600">{backendStatus}</span>
            </h3>
            {backendData && (
              <div className="text-sm text-gray-600">
                <p>API Version: {backendData.version}</p>
                <p>Last Check: {new Date(backendData.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Backlog</h3>
              <p className="text-gray-600">Keep track of games you want to play</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Currently Playing</h3>
              <p className="text-gray-600">Monitor your active gaming sessions</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Completed</h3>
              <p className="text-gray-600">Rate and review finished games</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;