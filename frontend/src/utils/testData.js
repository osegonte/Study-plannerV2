export const injectTestData = () => {
  const topics = [
    { id: '1', name: 'Mathematics', description: 'Calculus and Algebra', color: 'blue', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Physics', description: 'Quantum Mechanics', color: 'green', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: 'History', description: 'World History', color: 'purple', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const documents = [
    { id: '1', name: 'math-textbook.pdf', size: 5000000, topicId: '1', totalPages: 120, currentPage: 1, pageTimes: {}, uploadedAt: new Date().toISOString(), lastReadAt: new Date().toISOString() },
    { id: '2', name: 'physics-guide.pdf', size: 3000000, topicId: '2', totalPages: 85, currentPage: 1, pageTimes: {}, uploadedAt: new Date().toISOString(), lastReadAt: new Date().toISOString() }
  ];

  localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
  localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
  
  console.log('✅ Test data injected! Refresh the page to see it.');
  window.location.reload();
};

export const clearTestData = () => {
  localStorage.clear();
  console.log('✅ All data cleared! Refresh the page.');
  window.location.reload();
};

if (typeof window !== 'undefined') {
  window.injectTestData = injectTestData;
  window.clearTestData = clearTestData;
}
