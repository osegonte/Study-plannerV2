// Timer Diagnostic Utility
// Helps debug timing issues and verify timer functionality

export class TimerDiagnostic {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  // Start monitoring timer activity
  startMonitoring() {
    if (this.isRunning) {
      console.log('🕒 Timer monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🕒 Starting timer monitoring...');

    // Monitor localStorage changes for page times
    this.originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key.includes('pdf-study-planner-documents')) {
        try {
          const docs = JSON.parse(value);
          const totalPageTimes = docs.reduce((total, doc) => {
            return total + Object.keys(doc.pageTimes || {}).length;
          }, 0);
          console.log('🕒 Timer: Document data updated', {
            documents: docs.length,
            totalPageTimes
          });
        } catch (e) {
          // Ignore parsing errors
        }
      }
      this.originalSetItem.call(localStorage, key, value);
    };

    // Set up periodic checks
    this.monitorInterval = setInterval(() => {
      this.checkTimerStatus();
    }, 5000);

    console.log('✅ Timer monitoring active');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    if (this.originalSetItem) {
      localStorage.setItem = this.originalSetItem;
    }

    console.log('🛑 Timer monitoring stopped');
  }

  // Check current timer status
  checkTimerStatus() {
    const status = {
      timestamp: new Date().toLocaleTimeString(),
      documentsWithTiming: 0,
      totalPagesWithTiming: 0,
      recentActivity: false
    };

    try {
      const docs = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
      
      docs.forEach(doc => {
        const pageCount = Object.keys(doc.pageTimes || {}).length;
        if (pageCount > 0) {
          status.documentsWithTiming++;
          status.totalPagesWithTiming += pageCount;
        }

        // Check for recent activity (last 5 minutes)
        if (doc.lastReadAt) {
          const lastRead = new Date(doc.lastReadAt);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (lastRead > fiveMinutesAgo) {
            status.recentActivity = true;
          }
        }
      });

      // Log status every 5th check (every 25 seconds)
      if (Date.now() % 25000 < 5000) {
        console.log('🕒 Timer Status Check:', status);
      }

    } catch (error) {
      console.error('❌ Timer status check failed:', error);
    }

    return status;
  }

  // Test timer functionality manually
  async testTimer() {
    console.log('🧪 Testing timer functionality...');

    const tests = [
      {
        name: 'Timer Hook Import',
        test: () => {
          // Check if useTimeTracking is available
          const hasHook = !!window.React?.useState;
          return { success: hasHook, message: hasHook ? 'React hooks available' : 'React hooks not found' };
        }
      },
      {
        name: 'LocalStorage Access',
        test: () => {
          try {
            localStorage.setItem('timer-test', 'test');
            const result = localStorage.getItem('timer-test');
            localStorage.removeItem('timer-test');
            return { success: result === 'test', message: 'LocalStorage working' };
          } catch (error) {
            return { success: false, message: `LocalStorage error: ${error.message}` };
          }
        }
      },
      {
        name: 'Date/Time Functions',
        test: () => {
          try {
            const now = Date.now();
            const date = new Date();
            return { 
              success: typeof now === 'number' && date instanceof Date, 
              message: `Time functions working. Current: ${date.toLocaleTimeString()}` 
            };
          } catch (error) {
            return { success: false, message: `Date/Time error: ${error.message}` };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = test.test();
        results.push({ name: test.name, ...result });
        console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.message}`);
      } catch (error) {
        results.push({ name: test.name, success: false, message: error.message });
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }

    this.testResults = results;
    return results;
  }

  // Get current timer data from storage
  getTimerData() {
    try {
      const docs = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
      
      const timerData = docs.map(doc => ({
        name: doc.name,
        totalPages: doc.totalPages || 0,
        currentPage: doc.currentPage || 1,
        pagesWithTiming: Object.keys(doc.pageTimes || {}).length,
        totalTime: Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0),
        lastReadAt: doc.lastReadAt,
        averageTimePerPage: Object.keys(doc.pageTimes || {}).length > 0 
          ? Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0) / Object.keys(doc.pageTimes || {}).length 
          : 0
      }));

      return timerData;
    } catch (error) {
      console.error('❌ Error getting timer data:', error);
      return [];
    }
  }

  // Generate timer report
  generateReport() {
    const timerData = this.getTimerData();
    const status = this.checkTimerStatus();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        documentsWithTiming: status.documentsWithTiming,
        totalPagesWithTiming: status.totalPagesWithTiming,
        recentActivity: status.recentActivity
      },
      documents: timerData,
      testResults: this.testResults,
      recommendations: this.getRecommendations(timerData, status)
    };

    console.log('📊 Timer Diagnostic Report:', report);
    return report;
  }

  // Get recommendations based on timer status
  getRecommendations(timerData, status) {
    const recommendations = [];

    if (status.totalPagesWithTiming === 0) {
      recommendations.push('🔴 CRITICAL: No page timing data found. Timer may not be starting.');
      recommendations.push('💡 TIP: Check browser console for timer debug messages.');
      recommendations.push('💡 TIP: Try navigating between PDF pages to trigger timer.');
    } else if (status.totalPagesWithTiming < 3) {
      recommendations.push('🟡 LIMITED: Very little timing data. Timer working but may need more usage.');
      recommendations.push('💡 TIP: Read a few more pages to build timing data.');
    } else {
      recommendations.push('🟢 GOOD: Timer appears to be working correctly.');
    }

    if (!status.recentActivity) {
      recommendations.push('⏰ INFO: No recent timer activity detected.');
    }

    return recommendations;
  }
}

// Global instance
export const timerDiagnostic = new TimerDiagnostic();

// Add to window for console access
if (typeof window !== 'undefined') {
  window.timerDiagnostic = timerDiagnostic;
  
  // Convenience functions
  window.startTimerMonitoring = () => timerDiagnostic.startMonitoring();
  window.stopTimerMonitoring = () => timerDiagnostic.stopMonitoring();
  window.checkTimerStatus = () => timerDiagnostic.checkTimerStatus();
  window.getTimerData = () => timerDiagnostic.getTimerData();
  window.testTimer = () => timerDiagnostic.testTimer();
  
  console.log('🕒 Timer diagnostic tools loaded:');
  console.log('  - window.startTimerMonitoring()');
  console.log('  - window.checkTimerStatus()');
  console.log('  - window.getTimerData()');
  console.log('  - window.testTimer()');
}
