import { syncMutations } from './offlineQueue'

export function registerOnlineSync() {
  window.addEventListener('online', async () => {
    console.log('[Flux] Back online, syncing mutations...')
    await syncMutations()
  })

  window.addEventListener('offline', () => {
    console.log('[Flux] Going offline, mutations will be queued')
  })
}
