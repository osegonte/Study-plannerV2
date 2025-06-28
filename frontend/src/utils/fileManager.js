export class FileManager {
  constructor(userId) {
    this.userId = userId;
  }

  createFileMetadata(file, topicId, additionalData = {}) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.name,
      displayName: additionalData.customName || file.name,
      size: file.size,
      topicId,
      uploadedAt: new Date().toISOString()
    };
  }

  validatePDFFile(file) {
    const maxSize = 100 * 1024 * 1024;
    const errors = [];
    
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are allowed');
    }
    
    if (file.size > maxSize) {
      errors.push('File size must be less than 100MB');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
