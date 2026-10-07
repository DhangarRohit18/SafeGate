import { realtimeService } from '../services/realtimeService';

export interface BaseEntity {
  id: string;
  societyId?: string;
  createdAt?: Date | string | any;
  updatedAt?: Date | string | any;
  createdBy?: string;
  updatedBy?: string;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected abstract getConverter(): any;

  protected getCurrentUserId(): string | null {
    try {
      const rawUser = localStorage.getItem('aarizo_user') || localStorage.getItem('communityos_auth_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return parsed.id || parsed.uid || null;
      }
    } catch {}
    return null;
  }

  public async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & { societyId: string }): Promise<string> {
    const payload = {
      ...data,
      createdBy: this.getCurrentUserId(),
      updatedBy: this.getCurrentUserId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 100% PostgreSQL via Prisma backend
    const res = await fetch(`/api/collections/${this.collectionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-society-id': (data as any).societyId || 'soc-gvs',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create record in PostgreSQL table ${this.collectionName}: ${res.statusText}`);
    }

    const json = await res.json();
    return json.id;
  }

  public async getById(id: string): Promise<T | null> {
    // 100% PostgreSQL via Prisma backend
    try {
      const res = await fetch(`/api/collections/${this.collectionName}/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.id) return json as T;
      }
    } catch (err) {
      console.error(`[PostgreSQL] getById error for ${this.collectionName}/${id}:`, err);
    }
    return null;
  }

  public async update(id: string, data: Partial<Omit<T, 'id' | 'societyId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    const payload = {
      ...data,
      updatedBy: this.getCurrentUserId(),
      updatedAt: new Date().toISOString(),
    };

    // 100% PostgreSQL via Prisma backend
    const res = await fetch(`/api/collections/${this.collectionName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update record in PostgreSQL table ${this.collectionName}: ${res.statusText}`);
    }
  }

  public async delete(id: string): Promise<void> {
    // 100% PostgreSQL via Prisma backend
    const res = await fetch(`/api/collections/${this.collectionName}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error(`Failed to delete record in PostgreSQL table ${this.collectionName}: ${res.statusText}`);
    }
  }

  public async archive(id: string): Promise<void> {
    await this.update(id, { 
      status: 'archived',
    } as any);
  }

  public async upsertWithId(id: string, data: any): Promise<void> {
    const payload = {
      ...data,
      id,
      updatedBy: this.getCurrentUserId(),
      updatedAt: new Date().toISOString(),
    };

    // 100% PostgreSQL via Prisma backend
    const res = await fetch(`/api/collections/${this.collectionName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to upsert record in PostgreSQL table ${this.collectionName}: ${res.statusText}`);
    }
  }

  public async listAll(_constraints: any[] = []): Promise<T[]> {
    // 100% PostgreSQL via Prisma backend
    try {
      const res = await fetch(`/api/collections/${this.collectionName}`);
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const rows = await res.json();
        if (Array.isArray(rows)) return rows as T[];
      }
    } catch (err) {
      console.error(`[PostgreSQL] listAll error for ${this.collectionName}:`, err);
    }
    return [];
  }

  public subscribeAll(
    callback: (data: T[]) => void, 
    constraints: any[] = []
  ): () => void {
    // 1. Initial query from PostgreSQL
    this.listAll(constraints).then((items) => {
      callback(items);
    });

    // 2. Real-time PostgreSQL event stream via Server-Sent Events (SSE)
    const unsubRealtime = realtimeService.subscribe('*', (msg) => {
      if (this.isTopicRelevant(msg.topic)) {
        this.listAll(constraints).then(callback);
      }
    });

    return unsubRealtime;
  }

  public async list(societyId: string, _constraints: any[] = []): Promise<T[]> {
    // 100% PostgreSQL via Prisma backend
    try {
      const res = await fetch(`/api/collections/${this.collectionName}?societyId=${encodeURIComponent(societyId)}`, {
        headers: { 'x-society-id': societyId },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const rows = await res.json();
        if (Array.isArray(rows)) return rows as T[];
      }
    } catch (err) {
      console.error(`[PostgreSQL] list error for ${this.collectionName}:`, err);
    }
    return [];
  }

  public subscribe(
    societyId: string, 
    callback: (data: T[]) => void, 
    constraints: any[] = []
  ): () => void {
    // 1. Initial query from PostgreSQL
    this.list(societyId, constraints).then((items) => {
      callback(items);
    });

    // 2. Real-time PostgreSQL live synchronization via Server-Sent Events (SSE)
    const unsubRealtime = realtimeService.subscribe('*', (msg) => {
      if (this.isTopicRelevant(msg.topic)) {
        this.list(societyId, constraints).then(callback);
      }
    });

    return unsubRealtime;
  }

  /**
   * Universal real-time topic matcher to ensure all domain-specific events
   * trigger immediate UI updates across all clients.
   */
  private isTopicRelevant(topic: string): boolean {
    if (!topic || topic === 'GENERAL') return true;
    const t = topic.toUpperCase();
    const col = this.collectionName.toUpperCase();
    if (t.includes(col)) return true;

    // Domain mappings for common society features
    if (col.includes('VISITOR') && (t.includes('VISITOR') || t.includes('QR') || t.includes('GATE'))) return true;
    if (col.includes('PARCEL') && (t.includes('PARCEL') || t.includes('DELIVERY'))) return true;
    if (col.includes('MAINTENANCE') && t.includes('MAINTENANCE')) return true;
    if ((col.includes('BILLING') || col.includes('PAYMENT')) && (t.includes('PAYMENT') || t.includes('BILLING') || t.includes('INVOICE'))) return true;
    if (col.includes('ADVERTISEMENT') && t.includes('ADVERTISEMENT')) return true;
    if (col.includes('VENDOR') && t.includes('VENDOR')) return true;
    if (col.includes('EMERGENCY') && t.includes('EMERGENCY')) return true;
    if (col.includes('ANNOUNCEMENT') && t.includes('ANNOUNCEMENT')) return true;
    if (col.includes('EVENT') && t.includes('EVENT')) return true;
    if (col.includes('NOTIFICATION') && t.includes('NOTIFICATION')) return true;
    if (col.includes('STAFF') && (t.includes('STAFF') || t.includes('WORKER') || t.includes('ATTENDANCE'))) return true;
    if (col.includes('DOMESTIC') && (t.includes('WORKER') || t.includes('DOMESTIC'))) return true;
    if (col.includes('PARKING') && t.includes('PARKING')) return true;
    if (col.includes('AMENITY') && t.includes('AMENITY')) return true;
    if (col.includes('FLAT') && (t.includes('FLAT') || t.includes('RESIDENT'))) return true;
    if (col.includes('RESIDENT') && (t.includes('RESIDENT') || t.includes('FLAT'))) return true;

    return false;
  }
}



