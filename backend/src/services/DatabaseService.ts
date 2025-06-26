import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

export class DatabaseService {
  private static instance: DatabaseService | null = null
  private db: sqlite3.Database | null = null
  private dbPath: string
  private initialized: boolean = false
  private initializing: boolean = false
  private initializationPromise: Promise<void> | null = null

  private constructor() {
    this.dbPath = process.env.DATABASE_URL || './database/app.sqlite'
  }

  // Singleton pattern - only one instance per application
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized && this.db) {
      return
    }

    // If initialization is in progress, wait for it
    if (this.initializing && this.initializationPromise) {
      return this.initializationPromise
    }

    // Start initialization
    this.initializing = true
    this.initializationPromise = this._performInitialization()
    
    try {
      await this.initializationPromise
    } finally {
      this.initializing = false
    }
  }

  private async _performInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure database directory exists
        const dbDir = path.dirname(this.dbPath)
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true })
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('❌ Error opening database:', err.message)
            reject(err)
            return
          }
          
          console.log('📦 Connected to SQLite database (SINGLETON)')
          this.createTables()
            .then(() => {
              this.initialized = true
              console.log('✅ Database initialization complete')
              resolve()
            })
            .catch(reject)
        })
      } catch (error) {
        console.error('❌ Failed to initialize database:', error)
        reject(error)
      }
    })
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not available'))
        return
      }

      const tables = [
        // PDFs table
        `CREATE TABLE IF NOT EXISTS pdfs (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          total_pages INTEGER NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_accessed DATETIME
        )`,

        // Reading sessions table
        `CREATE TABLE IF NOT EXISTS reading_sessions (
          id TEXT PRIMARY KEY,
          pdf_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          duration INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pdf_id) REFERENCES pdfs (id) ON DELETE CASCADE
        )`,

        // Topics table
        `CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // PDF-Topic relationship table
        `CREATE TABLE IF NOT EXISTS pdf_topics (
          pdf_id TEXT NOT NULL,
          topic_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (pdf_id, topic_id),
          FOREIGN KEY (pdf_id) REFERENCES pdfs (id) ON DELETE CASCADE,
          FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        )`,

        // Reading progress table
        `CREATE TABLE IF NOT EXISTS reading_progress (
          pdf_id TEXT PRIMARY KEY,
          current_page INTEGER NOT NULL DEFAULT 1,
          total_time_spent INTEGER NOT NULL DEFAULT 0,
          pages_read INTEGER NOT NULL DEFAULT 0,
          last_read_at DATETIME,
          FOREIGN KEY (pdf_id) REFERENCES pdfs (id) ON DELETE CASCADE
        )`
      ]

      let completedTables = 0
      let hasError = false

      tables.forEach((sql, index) => {
        this.db!.run(sql, (err) => {
          if (err && !hasError) {
            hasError = true
            console.error(`❌ Error creating table ${index + 1}:`, err.message)
            reject(err)
          } else if (!hasError) {
            completedTables++
            if (completedTables === tables.length) {
              console.log('✅ Database tables initialized (SINGLETON)')
              resolve()
            }
          }
        })
      })
    })
  }

  getDatabase(): sqlite3.Database {
    if (!this.initialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.db
  }

  isInitialized(): boolean {
    return this.initialized && this.db !== null
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message)
          } else {
            console.log('📦 Database connection closed')
          }
          this.db = null
          this.initialized = false
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}