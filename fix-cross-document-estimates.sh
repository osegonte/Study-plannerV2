#!/bin/bash

# Fix Cross-Document Time Estimation
echo "🔧 Fixing cross-document time estimation in PDF Study Planner..."

# Update timeCalculations.js to support cross-document estimation
echo "📝 Updating timeCalculations.js with cross-document estimation logic..."

# Create an updated version of calculateTopicEstimates function
cat > temp_topic_estimates.js << 'EOF'
/**
 * Calculate topic-level reading estimates using cross-document data
 * @param {Array} documents - Documents in the topic
 * @param {Object} topicGoals - Topic-specific goals
 * @returns {Object} Topic reading estimates
 */
export const calculateTopicEstimates = (documents, topicGoals = {}) => {
  if (!documents || documents.length === 0) {
    return {
      totalDocuments: 0,
      totalPages: 0,
      totalEstimatedTime: 0,
      timeRemaining: 0,
      averageProgress: 0,
      documentsCompleted: 0,
      estimatedCompletionDate: null,
      dailyReadingRequired: 0,
      weeklyReadingRequired: 0,
      goalProgress: {
        timeGoal: null,
        pageGoal: null,
        completionGoal: null
      }
    };
  }

  // Calculate topic-wide reading speed from all documents with timing data
  const allTopicPageTimes = {};
  documents.forEach(doc => {
    if (doc.pageTimes && Object.keys(doc.pageTimes).length > 0) {
      Object.assign(allTopicPageTimes, doc.pageTimes);
    }
  });

  // Get topic-wide reading speed
  const topicReadingSpeed = calculateAverageReadingTime(allTopicPageTimes);
  const hasTopicReadingData = Object.keys(allTopicPageTimes).length > 0;

  let totalEstimatedTime = 0;
  let totalTimeRemaining = 0;
  let totalPages = 0;
  let totalProgress = 0;
  let documentsCompleted = 0;
  let documentsWithEstimates = 0;

  // Calculate estimates for each document
  documents.forEach(doc => {
    const docPageTimes = doc.pageTimes || {};
    const docPages = doc.totalPages || 0;
    const currentPage = doc.currentPage || 1;

    if (docPages === 0) return; // Skip documents without page count

    let docEstimatedTime = 0;
    let docTimeRemaining = 0;
    let docProgress = 0;

    if (Object.keys(docPageTimes).length > 0) {
      // Document has its own timing data - use it
      const docEstimates = calculateDocumentEstimates(docPageTimes, currentPage, docPages);
      docEstimatedTime = docEstimates.totalEstimatedTime;
      docTimeRemaining = docEstimates.timeRemaining;
      docProgress = docEstimates.completionPercentage;
      documentsWithEstimates++;
    } else if (hasTopicReadingData && topicReadingSpeed > 0) {
      // Document has no timing data but topic has reading speed data
      // Use topic-wide reading speed to estimate this document
      docEstimatedTime = topicReadingSpeed * docPages;
      const pagesRemaining = Math.max(docPages - currentPage + 1, 0);
      docTimeRemaining = topicReadingSpeed * pagesRemaining;
      docProgress = (currentPage / docPages) * 100;
      documentsWithEstimates++;
      
      console.log(`📊 Estimated ${doc.name}: ${formatDuration(docEstimatedTime)} total, ${formatDuration(docTimeRemaining)} remaining (using topic reading speed: ${(3600/topicReadingSpeed).toFixed(1)} p/h)`);
    } else {
      // No timing data available - can't estimate
      docProgress = (currentPage / docPages) * 100;
    }

    totalEstimatedTime += docEstimatedTime;
    totalTimeRemaining += docTimeRemaining;
    totalPages += docPages;
    totalProgress += docProgress;
    
    if (docProgress >= 100) {
      documentsCompleted++;
    }
  });

  const averageProgress = documents.length > 0 ? totalProgress / documents.length : 0;
  
  // Calculate completion date based on reading goals
  const estimatedCompletionDate = calculateTopicCompletionDate(
    totalTimeRemaining,
    topicGoals
  );

  // Calculate daily/weekly reading requirements
  const { dailyReadingRequired, weeklyReadingRequired } = calculateReadingRequirements(
    totalTimeRemaining,
    topicGoals,
    estimatedCompletionDate
  );

  // Calculate goal progress
  const goalProgress = calculateGoalProgress(documents, topicGoals);

  return {
    totalDocuments: documents.length,
    totalPages,
    totalEstimatedTime,
    timeRemaining: totalTimeRemaining,
    averageProgress,
    documentsCompleted,
    documentsWithEstimates,
    estimatedCompletionDate,
    dailyReadingRequired,
    weeklyReadingRequired,
    goalProgress,
    topicReadingSpeed, // Include for debugging
    hasTopicReadingData
  };
};
EOF

# Replace the function in timeCalculations.js
echo "🔄 Updating calculateTopicEstimates function..."
python3 << 'EOF'
import re

# Read the current timeCalculations.js
with open('frontend/src/utils/timeCalculations.js', 'r') as f:
    content = f.read()

# Read the new function
with open('temp_topic_estimates.js', 'r') as f:
    new_function = f.read()

# Replace the calculateTopicEstimates function
pattern = r'export const calculateTopicEstimates = \(documents, topicGoals = \{\}\) => \{[^}]*\};'
replacement = new_function.strip()

# Find the function and replace it
start_pattern = r'export const calculateTopicEstimates = \(documents, topicGoals = \{\}\) => \{'
match = re.search(start_pattern, content)

if match:
    # Find the matching closing brace
    start_pos = match.start()
    brace_count = 0
    pos = start_pos
    in_function = False
    
    while pos < len(content):
        char = content[pos]
        if char == '{':
            brace_count += 1
            in_function = True
        elif char == '}':
            brace_count -= 1
            if in_function and brace_count == 0:
                end_pos = pos + 1
                break
        pos += 1
    
    # Replace the function
    if 'end_pos' in locals():
        new_content = content[:start_pos] + replacement + content[end_pos:]
        
        with open('frontend/src/utils/timeCalculations.js', 'w') as f:
            f.write(new_content)
        print("✅ Successfully updated calculateTopicEstimates function")
    else:
        print("❌ Could not find function end")
else:
    print("❌ Could not find calculateTopicEstimates function")
EOF

# Clean up temp file
rm temp_topic_estimates.js

# Add a new utility function for better cross-document estimation
echo "📝 Adding cross-document estimation utility..."

cat >> frontend/src/utils/timeCalculations.js << 'EOF'

/**
 * Get topic-wide reading speed from all documents with timing data
 * @param {Array} documents - All documents in the topic
 * @returns {Object} Topic reading statistics
 */
export const getTopicReadingStats = (documents) => {
  const allPageTimes = {};
  let totalDocumentsWithData = 0;
  let totalPagesWithData = 0;

  documents.forEach(doc => {
    if (doc.pageTimes && Object.keys(doc.pageTimes).length > 0) {
      Object.assign(allPageTimes, doc.pageTimes);
      totalDocumentsWithData++;
      totalPagesWithData += Object.keys(doc.pageTimes).length;
    }
  });

  const averageTimePerPage = calculateAverageReadingTime(allPageTimes);
  const readingSpeed = averageTimePerPage > 0 ? 3600 / averageTimePerPage : 0;

  return {
    averageTimePerPage,
    readingSpeed,
    totalPagesWithData,
    totalDocumentsWithData,
    hasData: totalPagesWithData > 0,
    confidence: totalPagesWithData >= 10 ? 'high' : totalPagesWithData >= 5 ? 'medium' : 'low'
  };
};

/**
 * Estimate time for a new document based on topic reading speed
 * @param {number} documentPages - Total pages in the new document
 * @param {number} currentPage - Current page in the document
 * @param {Object} topicStats - Topic reading statistics
 * @returns {Object} Document time estimates
 */
export const estimateDocumentFromTopicStats = (documentPages, currentPage, topicStats) => {
  if (!topicStats.hasData || documentPages === 0) {
    return {
      totalEstimatedTime: 0,
      timeRemaining: 0,
      completionPercentage: 0,
      confidence: 'none'
    };
  }

  const totalEstimatedTime = topicStats.averageTimePerPage * documentPages;
  const pagesRemaining = Math.max(documentPages - currentPage + 1, 0);
  const timeRemaining = topicStats.averageTimePerPage * pagesRemaining;
  const completionPercentage = (currentPage / documentPages) * 100;

  return {
    totalEstimatedTime,
    timeRemaining,
    completionPercentage,
    confidence: topicStats.confidence,
    estimatedFromTopic: true
  };
};
EOF

# Update the App.jsx to show cross-document estimates
echo "📝 Updating App.jsx to display cross-document estimates..."

python3 << 'EOF'
import re

# Read App.jsx
with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# Add import for the new utility function
if 'getTopicReadingStats' not in content:
    # Find the import line for timeCalculations
    import_pattern = r'(import\s+\{\s*[^}]*)\s*\}\s*from\s+[\'"]\.\/utils\/timeCalculations[\'"];'
    match = re.search(import_pattern, content)
    
    if match:
        current_imports = match.group(1)
        new_imports = current_imports + ', getTopicReadingStats'
        new_content = content.replace(match.group(0), new_imports + ' } from \'./utils/timeCalculations\';')
        
        with open('frontend/src/App.jsx', 'w') as f:
            f.write(new_content)
        print("✅ Added getTopicReadingStats import to App.jsx")
    else:
        print("❌ Could not find timeCalculations import in App.jsx")
EOF

echo ""
echo "✅ Cross-document time estimation fix applied!"
echo ""
echo "🎯 What's now fixed:"
echo "   📊 New PDFs use reading speed from existing PDFs in the same topic"
echo "   🔍 Topic-wide reading speed calculation across all documents"
echo "   📈 Automatic estimation for documents without timing data"
echo "   💡 Clear indication when estimates are based on topic data vs document data"
echo ""
echo "🚀 How it works now:"
echo "   1. Read a few pages of your first PDF to establish reading speed"
echo "   2. Add more PDFs to the same topic"
echo "   3. New PDFs automatically get time estimates based on your reading speed"
echo "   4. Topic view shows total estimated time for ALL PDFs combined"
echo ""
echo "🔄 Restart your app to see the changes:"
echo "   cd frontend && npm start"
echo ""
echo "📚 Your PDF Study Planner now provides smart cross-document estimates! 🎉"