import { IRepository, StorageContainer, StorageMetadata, Migration, RepositoryError } from './types';
import { CURRENT_STORAGE_VERSION } from './migrations';

interface LocalStorageRepositoryOptions<T> {
  key: string;
  defaultValue: T;
  migrations: Migration[];
  currentVersion: number;
}

export class LocalStorageRepository<T> implements IRepository<T> {
  private key: string;
  private defaultValue: T;
  private migrations: Migration[];
  private currentVersion: number;
  private subscribers: Set<(data: T) => void>;
  private errorSubscribers: Set<(error: RepositoryError) => void>;
  private storageEventHandler: ((e: StorageEvent) => void) | null;
  private isWriting: boolean;

  constructor(options: LocalStorageRepositoryOptions<T>) {
    this.key = options.key;
    this.defaultValue = options.defaultValue;
    this.migrations = options.migrations;
    this.currentVersion = options.currentVersion;
    this.subscribers = new Set();
    this.errorSubscribers = new Set();
    this.storageEventHandler = null;
    this.isWriting = false;

    this.initializeStorage();
    this.setupCrossTabSync();
  }

  private initializeStorage(): void {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) {
        const initialContainer = this.createContainer(this.defaultValue);
        window.localStorage.setItem(this.key, JSON.stringify(initialContainer));
        return;
      }

      const parsed = JSON.parse(raw);
      
      if (!this.isContainerFormat(parsed)) {
        const migratedData = this.migrateLegacyData(parsed);
        const newContainer = this.createContainer(migratedData);
        window.localStorage.setItem(this.key, JSON.stringify(newContainer));
        return;
      }

      if (parsed.metadata.version < this.currentVersion) {
        const migratedData = this.runMigrations(parsed.data, parsed.metadata.version);
        const newContainer = this.createContainer(migratedData);
        window.localStorage.setItem(this.key, JSON.stringify(newContainer));
      }
    } catch (error) {
      console.error(`[Repository] Failed to initialize storage for key ${this.key}:`, error);
      const initialContainer = this.createContainer(this.defaultValue);
      try {
        window.localStorage.setItem(this.key, JSON.stringify(initialContainer));
      } catch (e) {
        this.emitError('initialize', e as Error);
      }
    }
  }

  private isContainerFormat(value: unknown): value is StorageContainer<T> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'metadata' in value &&
      'data' in value &&
      typeof (value as StorageContainer<T>).metadata?.version === 'number'
    );
  }

  private createContainer(data: T): StorageContainer<T> {
    return {
      metadata: {
        version: this.currentVersion,
        lastSyncedAt: null,
        lastModifiedAt: new Date().toISOString(),
      },
      data,
    };
  }

  private migrateLegacyData(legacyData: unknown): T {
    return legacyData as T;
  }

  private runMigrations(data: unknown, fromVersion: number): T {
    let currentData = data;
    let currentVersion = fromVersion;

    const sortedMigrations = [...this.migrations].sort((a, b) => a.fromVersion - b.fromVersion);

    for (const migration of sortedMigrations) {
      if (migration.fromVersion === currentVersion) {
        try {
          currentData = migration.migrate(currentData);
          currentVersion = migration.toVersion;
        } catch (error) {
          console.error(`[Repository] Migration failed from version ${migration.fromVersion} to ${migration.toVersion}:`, error);
          this.emitError('migration', error as Error);
          break;
        }
      }
    }

    return currentData as T;
  }

  private setupCrossTabSync(): void {
    if (typeof window === 'undefined') return;

    this.storageEventHandler = (e: StorageEvent) => {
      if (e.key !== this.key || e.newValue === null || this.isWriting) return;

      try {
        const container = JSON.parse(e.newValue);
        if (this.isContainerFormat(container)) {
          this.notifySubscribers(container.data);
        }
      } catch (error) {
        console.error('[Repository] Failed to parse cross-tab sync data:', error);
      }
    };

    window.addEventListener('storage', this.storageEventHandler);
  }

  async getAll(): Promise<T> {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) {
        return this.defaultValue;
      }

      const container = JSON.parse(raw) as StorageContainer<T>;
      return container.data;
    } catch (error) {
      console.error(`[Repository] Failed to read data for key ${this.key}:`, error);
      this.emitError('getAll', error as Error);
      return this.defaultValue;
    }
  }

  async save(data: T): Promise<void> {
    const previousValue = window.localStorage.getItem(this.key);

    try {
      this.isWriting = true;

      const raw = window.localStorage.getItem(this.key);
      let existingMetadata: StorageMetadata | undefined;

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (this.isContainerFormat(parsed)) {
            existingMetadata = parsed.metadata;
          }
        } catch {
          // ignore parse error
        }
      }

      const container: StorageContainer<T> = {
        metadata: {
          version: this.currentVersion,
          lastSyncedAt: existingMetadata?.lastSyncedAt || null,
          lastModifiedAt: new Date().toISOString(),
        },
        data,
      };

      window.localStorage.setItem(this.key, JSON.stringify(container));
      this.notifySubscribers(data);
    } catch (error) {
      console.error(`[Repository] Failed to save data for key ${this.key}:`, error);
      
      if (previousValue !== null) {
        try {
          window.localStorage.setItem(this.key, previousValue);
          console.warn(`[Repository] Rolled back to previous value for key ${this.key}`);
        } catch (rollbackError) {
          console.error(`[Repository] Failed to rollback for key ${this.key}:`, rollbackError);
        }
      }

      this.emitError('save', error as Error);
      throw error;
    } finally {
      this.isWriting = false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.isWriting = true;
      window.localStorage.removeItem(this.key);
      this.initializeStorage();
      this.notifySubscribers(this.defaultValue);
    } catch (error) {
      console.error(`[Repository] Failed to clear data for key ${this.key}:`, error);
      this.emitError('clear', error as Error);
      throw error;
    } finally {
      this.isWriting = false;
    }
  }

  subscribe(callback: (data: T) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  subscribeErrors(callback: (error: RepositoryError) => void): () => void {
    this.errorSubscribers.add(callback);
    return () => {
      this.errorSubscribers.delete(callback);
    };
  }

  private notifySubscribers(data: T): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[Repository] Subscriber error:', error);
      }
    });
  }

  private emitError(operation: string, error: Error): void {
    const repoError: RepositoryError = {
      operation,
      error,
      timestamp: new Date().toISOString(),
    };
    this.errorSubscribers.forEach(callback => {
      try {
        callback(repoError);
      } catch (e) {
        console.error('[Repository] Error subscriber error:', e);
      }
    });
  }

  async getMetadata(): Promise<StorageMetadata | null> {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      const container = JSON.parse(raw) as StorageContainer<T>;
      return container.metadata;
    } catch {
      return null;
    }
  }

  destroy(): void {
    if (this.storageEventHandler) {
      window.removeEventListener('storage', this.storageEventHandler);
      this.storageEventHandler = null;
    }
    this.subscribers.clear();
    this.errorSubscribers.clear();
  }
}
