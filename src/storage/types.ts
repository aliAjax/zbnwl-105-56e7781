export interface StorageMetadata {
  version: number;
  lastSyncedAt: string | null;
  lastModifiedAt: string;
}

export interface StorageContainer<T> {
  metadata: StorageMetadata;
  data: T;
}

export interface IRepository<T> {
  getAll(): Promise<T>;
  save(data: T): Promise<void>;
  clear(): Promise<void>;
  subscribe(callback: (data: T) => void): () => void;
}

export type MigrationFunction = (data: unknown) => unknown;

export interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: MigrationFunction;
}

export type RepositoryEvent = 'change' | 'error';

export interface RepositoryError {
  operation: string;
  error: Error;
  timestamp: string;
}
