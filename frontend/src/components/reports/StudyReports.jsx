import React, { useState } from 'react';
import { FileText, Download, BarChart3, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { formatDuration, calculateReadingSpeed } from '../../utils/timeCalculations';

const StudyReports = () => {
  const { topics, documents } = useStudyPlanner();
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(doc => doc.topicId === selectedTopic);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(doc => new Date(doc.lastReadAt) >= cutoffDate);
    }

    return filtered;
  };

  const handleExport = () => {
    const filteredDocs = getFilteredDocuments();
    let csvContent = 'Document Name,Topic,Progress (%),Study Time (seconds),Last Read\n';
    
    filteredDocs.forEach(doc => {
      const topic = topics.find(t => t.id === doc.topicId);
      const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
      const totalTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
      
      csvContent += `"${doc.name}","${topic?.name || 'Unknown'}",${progress.toFixed(1)},${totalTime},"${doc.lastReadAt}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `study-report-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSummaryReport = () => {
    const filteredDocs = getFilteredDocuments();
    const totalTime = filteredDocs.reduce((sum, doc) => 
      sum + Object.values(doc.pageTimes || {}).reduce((t, time) => t + time, 0), 0
    );
    const totalPages = filteredDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = filteredDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    
    const allPageTimes = filteredDocs.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
    const avgReadingSpeed = calculateReadingSpeed(allPageTimes);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Total Study Time</h3>
                <p className="text-2xl font-bold text-blue-600">{formatDuration(totalTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Pages Read</h3>
                <p className="text-2xl font-bold text-green-600">{pagesRead}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Avg Speed</h3>
                <p className="text-2xl font-bold text-purple-600">{avgReadingSpeed.toFixed(1)} p/h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Document</th>
                  <th className="text-left py-2">Topic</th>
                  <th className="text-left py-2">Progress</th>
                  <th className="text-left py-2">Study Time</th>
                  <th className="text-left py-2">Last Read</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const topic = topics.find(t => t.id === doc.topicId);
                  const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
                  const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
                  
                  return (
                    <tr key={doc.id} className="border-b">
                      <td className="py-2 font-medium">{doc.name}</td>
                      <td className="py-2">{topic?.name || 'Unknown'}</td>
                      <td className="py-2">{Math.round(progress)}%</td>
                      <td className="py-2">{formatDuration(docTime)}</td>
                      <td className="py-2">{new Date(doc.lastReadAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Reports</h1>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {renderSummaryReport()}
    </div>
  );
};

export default StudyReports;
