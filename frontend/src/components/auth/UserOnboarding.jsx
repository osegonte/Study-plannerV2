import React, { useState } from 'react';
import { User, Zap, BookOpen, Target } from 'lucide-react';

const UserOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    school: '',
    major: '',
    semester: '',
    quickSetup: false
  });

  const handleQuickSetup = () => {
    const quickData = {
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      school: 'Test University',
      major: 'Computer Science',
      semester: 'Fall 2024',
      quickSetup: true
    };
    onComplete(quickData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username && formData.email) {
      onComplete(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to PDF Study Planner!</h2>
          <p className="text-gray-600">Set up your study environment</p>
        </div>

        {/* Quick Setup Option */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Zap className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Quick Testing Setup</h3>
          </div>
          <p className="text-green-700 text-sm mb-3">
            Skip the form and start testing immediately with sample data.
          </p>
          <button
            onClick={handleQuickSetup}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Quick Setup for Testing
          </button>
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">
          — OR —
        </div>
        
        {/* Manual Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School/University (Optional)</label>
            <input
              type="text"
              placeholder="Your school"
              value={formData.school}
              onChange={(e) => setFormData({...formData, school: e.target.value})}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          📚 Ready to transform your study experience!
        </div>
      </div>
    </div>
  );
};

export default UserOnboarding;
