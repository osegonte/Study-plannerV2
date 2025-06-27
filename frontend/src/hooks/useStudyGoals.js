import { useState, useEffect } from 'react';
import { useStudyPlanner } from '../contexts/StudyPlannerContext';

const STORAGE_KEY = 'pdf-study-planner-goals';

export const useStudyGoals = () => {
  const [goals, setGoals] = useState([]);
  const { documents } = useStudyPlanner();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load goals from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals to localStorage:', error);
    }
  }, [goals]);

  const createGoal = (goalData) => {
    const newGoal = {
      id: Date.now().toString(),
      title: goalData.title.trim(),
      type: goalData.type,
      target: goalData.target,
      description: goalData.description?.trim() || '',
      deadline: goalData.deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };

    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = (goalId, updates) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    ));
  };

  const deleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };

  const getGoalProgress = (goal) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let current = 0;
    let target = goal.target;

    switch (goal.type) {
      case 'daily_time':
        current = documents.reduce((sum, doc) => {
          const todayTimes = Object.entries(doc.pageTimes || {}).filter(([page, time]) => {
            return new Date(doc.lastReadAt) >= startOfDay;
          });
          return sum + todayTimes.reduce((pageSum, [, time]) => pageSum + time, 0);
        }, 0) / 60;
        break;

      case 'weekly_time':
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        current = documents.reduce((sum, doc) => {
          const weekTimes = Object.entries(doc.pageTimes || {}).filter(([page, time]) => {
            return new Date(doc.lastReadAt) >= startOfWeek;
          });
          return sum + weekTimes.reduce((pageSum, [, time]) => pageSum + time, 0);
        }, 0) / 60;
        break;

      case 'pages_per_day':
        current = documents.reduce((sum, doc) => {
          if (new Date(doc.lastReadAt) >= startOfDay) {
            return sum + Object.keys(doc.pageTimes || {}).length;
          }
          return sum;
        }, 0);
        break;

      case 'reading_speed':
        const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
        const totalTime = Object.values(allPageTimes).reduce((sum, time) => sum + time, 0);
        current = totalTime > 0 ? (Object.keys(allPageTimes).length * 3600) / totalTime : 0;
        break;

      default:
        current = 0;
    }

    const percentage = target > 0 ? (current / target) * 100 : 0;

    return {
      current: Math.round(current * 10) / 10,
      target: target,
      percentage: Math.min(percentage, 100)
    };
  };

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress
  };
};
