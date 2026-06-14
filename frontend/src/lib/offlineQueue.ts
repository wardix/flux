import { getOfflineDb, type OfflineMutation } from './offlineDb'

export async function enqueueMutation(
  mutation: Omit<OfflineMutation, 'timestamp' | 'retries' | 'status'>,
) {
  const db = await getOfflineDb()
  const newMutation: OfflineMutation = {
    ...mutation,
    timestamp: Date.now(),
    retries: 0,
    status: 'pending',
  }
  try {
    await db.add('mutations', newMutation)
  } finally {
    db.close()
  }
  console.log('[Offline Queue] Enqueued mutation:', mutation.type)
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await getOfflineDb()
  try {
    const index = db.transaction('mutations').store.index('by-status')
    const pending = await index.getAll('pending')
    return pending.sort((a, b) => a.timestamp - b.timestamp)
  } finally {
    db.close()
  }
}

export async function syncMutations() {
  if (!navigator.onLine) return

  const pending = await getPendingMutations()
  if (pending.length === 0) return

  console.log(`[Offline Queue] Syncing ${pending.length} pending mutations...`)

  const token = localStorage.getItem('token')

  const db = await getOfflineDb()

  try {
    for (const mut of pending) {
      try {
        // Use clean window fetch to prevent store loop/deadlock
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const res = await fetch(
          mut.endpoint.startsWith('/') ? mut.endpoint : `/api${mut.endpoint}`,
          {
            method: mut.method,
            headers,
            body: (mut.method as string) !== 'GET' ? JSON.stringify(mut.payload) : undefined,
          },
        )

        if (res.ok) {
          // Success: delete mutation from IndexedDB
          if (mut.id !== undefined) {
            await db.delete('mutations', mut.id)
            console.log(`[Offline Queue] Synced & removed mutation ${mut.id}: ${mut.type}`)
          }
        } else {
          throw new Error(`Server returned ${res.status}`)
        }
      } catch (err) {
        console.error(`[Offline Queue] Failed to sync mutation ${mut.id}:`, err)
        if (mut.id !== undefined) {
          const nextRetries = mut.retries + 1
          if (nextRetries >= 3) {
            // Exceeded retry count: mark as failed
            await db.put('mutations', {
              ...mut,
              retries: nextRetries,
              status: 'failed',
            })
            console.error(`[Offline Queue] Mutation ${mut.id} marked as failed after 3 attempts.`)
          } else {
            // Increment retries
            await db.put('mutations', {
              ...mut,
              retries: nextRetries,
            })
          }
        }
        // Stop executing further mutations to preserve sequence order (FIFO integrity)
        break
      }
    }
  } finally {
    db.close()
  }
}

export async function clearFailedMutations() {
  const db = await getOfflineDb()
  try {
    const all = await db.getAll('mutations')
    for (const m of all) {
      if (m.status === 'failed' && m.id !== undefined) {
        await db.delete('mutations', m.id)
      }
    }
  } finally {
    db.close()
  }
}
