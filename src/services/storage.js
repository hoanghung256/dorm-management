// src/services/storage.js
// Firebase Storage initialization and upload helper
import { initializeApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

let app
let storage

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config)
    storage = getStorage(app)
  }
  return storage
}

export async function uploadEvidence(file, pathPrefix = 'evidence') {
  if (!storage) throw new Error('Firebase not initialized. Call initFirebase first.')
  const fileRef = ref(storage, `${pathPrefix}/${Date.now()}-${file.name}`)
  const snapshot = await uploadBytes(fileRef, file)
  return await getDownloadURL(snapshot.ref)
}
