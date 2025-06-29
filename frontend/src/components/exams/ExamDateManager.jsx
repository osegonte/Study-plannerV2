import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Target } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const ExamDateManager = () => {
  const { topics, updateTopic } = useStudyPlanner();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [examDate, setExamDate] = useState('');
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(2);
  const [priority, setPriority] = useState('medium');

  const handleSetExamDate = (e) => {
    e.preventDefault();
    if (!selectedTopic || !examDate) return;

    const topic = topics.find(t => t.id === selectedTopic);
    if (!topic) return;

    const examData = {
      examDate: new Date(examDate),
      studyHoursPerDay,
      priority,
      setAt: new Date()
    };

    updateTopic(selectedTopic, {
      ...topic,
      examDate: examData
    });

    setSelectedTopic('');
    setExamDate('');
    setStudyHoursPerDay(2);
    setPriority('medium');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Exam Date Management
        </h2>

        <form onSubmit={handleSetExamDate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a topic...</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Hours Per Day
              </label>
              <input
                type="number"
                value={studyHoursPerDay}
                onChange={(e) => setStudyHoursPerDay(parseFloat(e.target.value))}
                min="0.5"
                max="12"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Set Exam Date
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExamDateManager;
