import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { FIREBASE_API_KEY } from "../constants/env";

/**
 * Firebase Storage folder paths.
 * You can add more as needed.
 */
export const FOLDERS = {
    INVOICES: "invoices",
};

/**
 * Initialize (idempotent) Firebase app using Vite env vars.
 */
function getFirebase() {
    const firebaseConfig = {
        apiKey: FIREBASE_API_KEY,
        authDomain: "dorm-management-95f70.firebaseapp.com",
        projectId: "dorm-management-95f70",
        storageBucket: "dorm-management-95f70.firebasestorage.app",
        messagingSenderId: "817267933694",
        appId: "1:817267933694:web:a05bd66a5b51e140c540af",
        measurementId: "G-3LNE2XF9MY",
    };
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const storage = getStorage(app);
    return { app, storage };
}

/**
 * Upload a File/Blob to Firebase Storage and return only the stored path.
 * @param {File|Blob} file
 * @param {Object} options
 * @param {string} [options.folder='uploads']
 * @param {string} [options.fileName]
 * @param {function(progress:number, snapshot:UploadTaskSnapshot):void} [options.onProgress]
 * @param {Object} [options.metadata]
 * @returns {Promise<string>} Resolves with the storage path
 */
export function uploadFile(file, { folder = "uploads", fileName, onProgress, metadata } = {}) {
    if (!file) return Promise.reject(new Error("No file provided"));

    const { storage } = getFirebase();

    const ext = file.name && file.name.includes(".") ? file.name.split(".").pop() : "dat";

    if (!fileName) {
        const rand =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);
        fileName = `${Date.now()}-${rand}.${ext}`;
    }

    const path = `${folder.replace(/\/+$/, "")}/${fileName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
        task.on(
            "state_changed",
            (snapshot) => {
                if (onProgress) {
                    const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(pct, snapshot);
                }
            },
            (err) => reject(err),
            () => {
                // Only return the path now
                resolve(path);
            },
        );
    });
}

/**
 * Get a download URL later if you only stored the path.
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function getFileDownloadURL(path) {
    const { storage } = getFirebase();
    return getDownloadURL(ref(storage, path));
}

/**
 * Delete a stored file.
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
    const { storage } = getFirebase();
    await deleteObject(ref(storage, path));
}
