// Test environment setup
console.log('🧪 Setting up test environment...');

// Check if localStorage is available
if (typeof(Storage) !== "undefined") {
    console.log('✅ LocalStorage is available');
} else {
    console.log('❌ LocalStorage not available');
}

// Test PDF.js worker path
const worker = '/pdf.worker.min.js';
console.log('📄 PDF.js worker configured:', worker);

console.log('🎉 Test environment ready!');
