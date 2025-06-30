// Buffer Diagnostic Utility for PDF Study Planner
// Helps diagnose and fix ArrayBuffer detachment issues

export class BufferDiagnostic {
  constructor() {
    this.testResults = [];
    this.bufferPool = new Map();
  }

  // Test ArrayBuffer creation and stability
  async testBufferCreation(file) {
    const tests = [
      {
        name: 'FileReader ArrayBuffer',
        test: () => this.testFileReaderBuffer(file)
      },
      {
        name: 'Direct arrayBuffer()',
        test: () => this.testDirectBuffer(file)
      },
      {
        name: 'Fetch Blob URL',
        test: () => this.testFetchBuffer(file)
      },
      {
        name: 'Uint8Array Conversion',
        test: () => this.testUint8Buffer(file)
      }
    ];

    console.log('🔍 Running buffer creation tests...');
    const results = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const buffer = await test.test();
        const duration = Date.now() - startTime;
        
        const result = {
          name: test.name,
          success: true,
          buffer,
          duration,
          size: buffer.byteLength,
          stable: this.testBufferStability(buffer)
        };
        
        results.push(result);
        console.log(`✅ ${test.name}: ${duration}ms, ${buffer.byteLength} bytes, stable: ${result.stable}`);
        
      } catch (error) {
        const result = {
          name: test.name,
          success: false,
          error: error.message,
          duration: 0,
          size: 0,
          stable: false
        };
        
        results.push(result);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    this.testResults = results;
    return results;
  }

  // Test FileReader approach
  async testFileReaderBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          if (!(buffer instanceof ArrayBuffer)) {
            throw new Error('Not an ArrayBuffer');
          }
          // Create immediate copy
          const stable = buffer.slice();
          resolve(stable);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Test direct arrayBuffer() method
  async testDirectBuffer(file) {
    const buffer = await file.arrayBuffer();
    return buffer.slice(); // Create copy immediately
  }

  // Test fetch blob URL approach
  async testFetchBuffer(file) {
    const url = URL.createObjectURL(file);
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return buffer.slice();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Test Uint8Array conversion approach
  async testUint8Buffer(file) {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const copy = new Uint8Array(uint8.length);
    copy.set(uint8);
    return copy.buffer;
  }

  // Test buffer stability (detachment resistance)
  testBufferStability(buffer) {
    try {
      // Try to access the buffer multiple times
      const view1 = new Uint8Array(buffer);
      const view2 = new Uint8Array(buffer);
      
      // Test if we can still access after creating views
      return view1.length > 0 && view2.length > 0 && buffer.byteLength > 0;
    } catch (error) {
      return false;
    }
  }

  // Get the best buffer creation method based on test results
  getBestMethod() {
    const successfulTests = this.testResults.filter(r => r.success && r.stable);
    if (successfulTests.length === 0) {
      return null;
    }

    // Sort by stability first, then by speed
    successfulTests.sort((a, b) => {
      if (a.stable !== b.stable) return b.stable - a.stable;
      return a.duration - b.duration;
    });

    return successfulTests[0];
  }

  // Create a stable buffer using the best method
  async createStableBuffer(file) {
    const bestMethod = this.getBestMethod();
    if (!bestMethod) {
      throw new Error('No suitable buffer creation method found');
    }

    console.log(`📄 Using best method: ${bestMethod.name}`);
    
    switch (bestMethod.name) {
      case 'FileReader ArrayBuffer':
        return this.testFileReaderBuffer(file);
      case 'Direct arrayBuffer()':
        return this.testDirectBuffer(file);
      case 'Fetch Blob URL':
        return this.testFetchBuffer(file);
      case 'Uint8Array Conversion':
        return this.testUint8Buffer(file);
      default:
        throw new Error('Unknown buffer creation method');
    }
  }

  // Generate diagnostic report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      totalTests: this.testResults.length,
      successfulTests: this.testResults.filter(r => r.success).length,
      stableTests: this.testResults.filter(r => r.stable).length,
      bestMethod: this.getBestMethod()?.name || 'None',
      results: this.testResults,
      recommendations: this.getRecommendations()
    };

    return report;
  }

  // Get recommendations based on test results
  getRecommendations() {
    const recommendations = [];
    
    const successfulTests = this.testResults.filter(r => r.success);
    const stableTests = this.testResults.filter(r => r.stable);
    
    if (successfulTests.length === 0) {
      recommendations.push('CRITICAL: No buffer creation methods working. Check browser compatibility.');
    } else if (stableTests.length === 0) {
      recommendations.push('WARNING: Buffers are being created but are unstable. ArrayBuffer detachment likely.');
    } else if (stableTests.length < successfulTests.length) {
      recommendations.push('NOTICE: Some buffer methods are unstable. Using most stable method.');
    } else {
      recommendations.push('SUCCESS: All buffer creation methods are stable.');
    }

    const bestMethod = this.getBestMethod();
    if (bestMethod) {
      recommendations.push(`RECOMMENDATION: Use "${bestMethod.name}" method for best performance.`);
    }

    return recommendations;
  }

  // Export diagnostic data
  exportDiagnostic() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `buffer-diagnostic-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    return report;
  }
}

// Global diagnostic instance
export const bufferDiagnostic = new BufferDiagnostic();

// Add to window for console access
if (typeof window !== 'undefined') {
  window.bufferDiagnostic = bufferDiagnostic;
  
  // Convenience function for quick testing
  window.testPDFBuffer = async (file) => {
    if (!file) {
      console.log('Usage: testPDFBuffer(fileObject)');
      return;
    }
    
    const results = await bufferDiagnostic.testBufferCreation(file);
    const report = bufferDiagnostic.generateReport();
    
    console.log('📊 Buffer Diagnostic Report:');
    console.table(results);
    console.log('🎯 Recommendations:', report.recommendations);
    
    return report;
  };
  
  console.log('🔍 Buffer diagnostic tools loaded:');
  console.log('  - window.bufferDiagnostic');
  console.log('  - window.testPDFBuffer(file)');
}
