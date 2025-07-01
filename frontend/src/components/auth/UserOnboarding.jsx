import React, { useState } from 'react';
import { User, BookOpen } from 'lucide-react';

const UserOnboarding = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    username: 'demo',
    email: 'demo@example.com',
    displayName: 'Demo User'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleQuickSetup = () => {
    onComplete({
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      quickSetup: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to PDF Study Planner!</h2>
          <p className="text-gray-600">Set up your study environment</p>
        </div>

        <div className="mb-4">
          <button
            onClick={handleQuickSetup}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Quick Demo Setup
          </button>
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">— OR —</div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserOnboarding;
