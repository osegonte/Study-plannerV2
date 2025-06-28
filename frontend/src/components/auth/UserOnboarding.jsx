import React, { useState } from 'react';
import { User } from 'lucide-react';

const UserOnboarding = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    school: '',
    major: '',
    semester: ''
  });

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
          <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
          <p className="text-gray-600">Set up your PDF Study Planner</p>
        </div>
        
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
          <input
            type="text"
            placeholder="School/University"
            value={formData.school}
            onChange={(e) => setFormData({...formData, school: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserOnboarding;
