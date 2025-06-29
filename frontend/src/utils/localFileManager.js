// Local File Manager for automatic folder creation and PDF organization
export class LocalFileManager {
  constructor() {
    this.baseDir = this.getStudyMaterialsPath();
  }

  getStudyMaterialsPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    return `${homeDir}/StudyMaterials`;
  }

  async createTopicFolder(topic) {
    const folderName = this.sanitizeFolderName(topic.name);
    const folderPath = `${this.baseDir}/${folderName}`;

    try {
      // For web version, store path for manual creation
      this.storePathForManualCreation(folderPath);
      this.updateTopicWithFolderPath(topic.id, folderPath);
      
      console.log(`📁 Topic folder planned: ${folderPath}`);
      return folderPath;
    } catch (error) {
      console.error('Failed to create topic folder:', error);
      throw new Error(`Failed to create folder for topic "${topic.name}"`);
    }
  }

  sanitizeFolderName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '')
      .substring(0, 100)
      .replace(/^\.+|\.+$/g, '');
  }

  storePathForManualCreation(folderPath) {
    const pendingFolders = JSON.parse(localStorage.getItem('pendingFolderCreation') || '[]');
    if (!pendingFolders.includes(folderPath)) {
      pendingFolders.push(folderPath);
      localStorage.setItem('pendingFolderCreation', JSON.stringify(pendingFolders));
    }
  }

  updateTopicWithFolderPath(topicId, folderPath) {
    const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
    const updatedTopics = topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, folderPath, folderCreatedAt: new Date().toISOString() }
        : topic
    );
    localStorage.setItem('pdf-study-planner-topics', JSON.stringify(updatedTopics));
  }

  getPendingFolders() {
    return JSON.parse(localStorage.getItem('pendingFolderCreation') || '[]');
  }

  generateBashScript() {
    const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
    
    let script = '#!/bin/bash\n\n';
    script += '# PDF Study Planner - Folder Creation Script\n\n';
    script += `BASE_DIR="${this.baseDir}"\n\n`;
    script += 'echo "Creating study material folders..."\n\n';
    script += 'mkdir -p "$BASE_DIR"\n\n';
    
    topics.forEach(topic => {
      const folderName = this.sanitizeFolderName(topic.name);
      script += `echo "Creating folder: ${topic.name}"\n`;
      script += `mkdir -p "$BASE_DIR/${folderName}"\n\n`;
    });
    
    script += 'echo "✅ All folders created successfully!"\n';
    return script;
  }

  downloadFolderCreationScript() {
    const script = this.generateBashScript();
    const blob = new Blob([script], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create_study_folders.sh';
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

export const localFileManager = new LocalFileManager();
