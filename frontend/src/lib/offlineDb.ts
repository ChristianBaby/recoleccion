/**
 * Utilidades para el almacenamiento temporal offline de incidencias usando IndexedDB.
 */

export interface OfflineIncident {
  id?: string
  type: string
  description: string
  address?: string
  lat?: number
  lng?: number
  base64Image?: string // Imagen comprimida en base64 para poder guardarla localmente
  createdAt: string
}

const DB_NAME = 'sirrss-offline-db'
const STORE_NAME = 'offline-incidents'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB no está disponible en el servidor (SSR)'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveOfflineIncident(incident: Omit<OfflineIncident, 'id' | 'createdAt'> & { base64Image?: string }): Promise<string> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const record: OfflineIncident = {
      ...incident,
      id,
      createdAt: new Date().toISOString()
    }

    const request = store.add(record)

    request.onsuccess = () => {
      resolve(id)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export async function getOfflineIncidents(): Promise<OfflineIncident[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('Error al leer de IndexedDB:', error)
    return []
  }
}

export async function deleteOfflineIncident(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}
