import { type DBSchema, openDB } from 'idb'

export interface OfflineMutation {
  id?: number
  type: string
  payload: any
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  timestamp: number
  retries: number
  status: 'pending' | 'failed'
}

interface OfflineDBSchema extends DBSchema {
  mutations: {
    key: number
    value: OfflineMutation
    indexes: {
      'by-status': string
    }
  }
}

export async function getOfflineDb() {
  return await openDB<OfflineDBSchema>('flux-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('mutations')) {
        const store = db.createObjectStore('mutations', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('by-status', 'status')
      }
    },
    blocked() {
      console.warn('Database upgrade blocked, closing database.')
    },
    blocking() {
      console.warn('Database blocking, closing.')
    },
  })
}
