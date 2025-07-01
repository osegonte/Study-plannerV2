// PDF utility functions for the study planner

export const validatePDFFile = (file) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { valid: false, error: 'File too large (max 50MB)' };
  }
  
  return { valid: true };
};

export const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const generatePDFId = (fileName) => {
  return `pdf_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
};
