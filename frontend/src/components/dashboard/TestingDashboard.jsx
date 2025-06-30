import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Upload, 
  BookOpen, 
  Timer, 
  BarChart3, 
  Target,
  Play,
  ArrowRight,
  Zap,
  FileText
} from 'lucide-react';

const TestingDashboard = ({ 
  topics, 
  documents, 
  onNavigate, 
  onQuickActions 
}) => {
  const [testingProgress] = useState({
    profileSetup: true, // Already completed if we're here
    topicsCreated: topics.length > 0,
    pdfsUploaded: documents.length > 0,
    studySessionStarted: documents.some(doc => Object.keys(doc.pageTimes || {}).length > 0),
    analyticsViewed: false
  });

  const testingSteps = [
    {
      id: 'profileSetup',
      title: 'Profile Setup',
      description: 'Create your user profile',
      icon: CheckCircle,
      action: null,
      completed: testingProgress.profileSetup
    },
    {
      id: 'topicsCreated',
      title: 'Organize Topics',
      description: 'Create study topics to organize your PDFs',
      icon: BookOpen,
      action: () => onNavigate('topics'),
      actionText: topics.length > 0 ? 'Manage Topics' : 'Create Topics',
      completed: testingProgress.topicsCreated,
      count: topics.length
    },
    {
      id: 'pdfsUploaded',
      title: 'Upload Study Materials',
      description: 'Upload your PDF study materials',
      icon: Upload,
      action: () => onNavigate('upload'),
      actionText: documents.length > 0 ? 'Upload More PDFs' : 'Upload PDFs',
      completed: testingProgress.pdfsUploaded,
      count: documents.length
    },
    {
      id: 'studySessionStarted',
      title: 'Start Studying',
      description: 'Read PDFs and track your study time',
      icon: Timer,
      action: documents.length > 0 ? () => {
        const firstDoc = documents[0];
        onNavigate('viewer', firstDoc);
      } : () => onNavigate('upload'),
      actionText: documents.length > 0 ? 'Start Reading' : 'Upload PDFs First',
      completed: testingProgress.studySessionStarted,
      disabled: documents.length === 0
    },
    {
      id: 'analyticsViewed',
      title: 'View Analytics',
      description: 'Check your study progress and estimates',
      icon: BarChart3,
      action: () => onNavigate('analytics'),
      actionText: 'View Analytics',
      completed: testingProgress.analyticsViewed
    }
  ];

  const completedSteps = testingSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / testingSteps.length) * 100;

  const getStepStatus = (step) => {
    if (step.completed) return 'completed';
    if (step.disabled) return 'disabled';
    return 'pending';
  };

  const getStepColors = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'disabled':
        return 'bg-gray-50 border-gray-200 text-gray-500';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          📚 Welcome to PDF Study Planner Testing!
        </h1>
        <p className="text-blue-100 mb-4">
          Follow this comprehensive testing guide to explore all features.
        </p>
        
        {/* Progress Bar */}
        <div className="bg-white bg-opacity-20 rounded-full h-2 mb-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-blue-100">
          {completedSteps} of {testingSteps.length} steps completed ({Math.round(progressPercentage)}%)
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Start Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onQuickActions?.sampleData?.()}
            className="p-4 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Load Sample Data</div>
                <div className="text-sm text-gray-600">Add test topics and documents</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('test')}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Test PDF Viewer</div>
                <div className="text-sm text-gray-600">Basic PDF functionality test</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('upload')}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Upload PDF</div>
                <div className="text-sm text-gray-600">Start with your own PDFs</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Testing Steps */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📋 Comprehensive Testing Guide
        </h2>
        
        <div className="space-y-4">
          {testingSteps.map((step) => {
            const status = getStepStatus(step);
            const IconComponent = step.completed ? CheckCircle : 
                               status === 'disabled' ? Circle : 
                               step.icon;
            
            return (
              <div
                key={step.id}
                className={`border-2 rounded-lg p-4 transition-all ${getStepColors(status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-100' : 
                        status === 'disabled' ? 'bg-gray-100' : 
                        'bg-blue-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          step.completed ? 'text-green-600' : 
                          status === 'disabled' ? 'text-gray-500' : 
                          'text-blue-600'
                        }`} />
                      </div>
                      
                      <div>
                        <div className="font-medium">
                          {step.title}
                          {step.count !== undefined && (
                            <span className="ml-2 text-sm opacity-75">
                              ({step.count})
                            </span>
                          )}
                        </div>
                        <div className="text-sm opacity-75">{step.description}</div>
                      </div>
                    </div>
                  </div>
                  
                  {step.action && (
                    <button
                      onClick={step.action}
                      disabled={status === 'disabled'}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        step.completed 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : status === 'disabled'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <span>{step.actionText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 text-center">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
          <div className="text-sm text-gray-600">Study Topics</div>
        </div>

        <div className="bg-white border rounded-lg p-6 text-center">
          <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
          <div className="text-sm text-gray-600">PDF Documents</div>
        </div>

        <div className="bg-white border rounded-lg p-6 text-center">
          <Timer className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0)}
          </div>
          <div className="text-sm text-gray-600">Pages Timed</div>
        </div>
      </div>

      {/* Next Steps */}
      {progressPercentage < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Next Step</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            {completedSteps === 0 && "Start by creating some study topics to organize your materials."}
            {completedSteps === 1 && "Upload your first PDF document to begin studying."}
            {completedSteps === 2 && "Start reading a PDF to test the timer and tracking features."}
            {completedSteps === 3 && "Check out the analytics to see your reading estimates and progress."}
            {completedSteps >= 4 && "Great job! You've tested all the core features."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TestingDashboard;
