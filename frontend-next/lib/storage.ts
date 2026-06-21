// Local storage utilities for document management

import type { Diagnosis } from "./api";

export interface DocumentMetadata {
  id: string;
  filename: string;
  classId: string;
  lessonId: string;
  uploadDate: string;
  status: "uploading" | "complete" | "optimizing" | "optimized" | "error";
  metrics?: any;
  optimizedMetrics?: any;
  optimizationResultId?: string;
  diagnoses?: Diagnosis[];
}

const STORAGE_KEY = "curriculearn_documents";

export const getDocuments = (classId: string): DocumentMetadata[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  const all = JSON.parse(data);
  return all.filter((doc: DocumentMetadata) => doc.classId === classId);
};

export const getDocument = (classId: string, docId: string): DocumentMetadata | null => {
  const docs = getDocuments(classId);
  return docs.find(doc => doc.id === docId) || null;
};

export const updateDocument = (
  classId: string,
  docId: string,
  updates: Partial<DocumentMetadata>
): void => {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(STORAGE_KEY);
  const all: DocumentMetadata[] = data ? JSON.parse(data) : [];
  const index = all.findIndex(doc => doc.id === docId && doc.classId === classId);
  if (index >= 0) {
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent("curriculearn-storage-change"));
  }
};

export const addDocument = (doc: DocumentMetadata): void => {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(STORAGE_KEY);
  const all: DocumentMetadata[] = data ? JSON.parse(data) : [];

  // Check if document already exists (upsert logic)
  const existingIndex = all.findIndex(d => d.id === doc.id);
  if (existingIndex >= 0) {
    all[existingIndex] = doc;
  } else {
    all.push(doc);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  // Dispatch custom event for same-window updates
  window.dispatchEvent(new CustomEvent("curriculearn-storage-change"));
};

export const deleteDocument = (classId: string, docId: string): void => {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(STORAGE_KEY);
  const all: DocumentMetadata[] = data ? JSON.parse(data) : [];
  const filtered = all.filter(doc => !(doc.id === docId && doc.classId === classId));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  // Dispatch custom event for same-window updates
  window.dispatchEvent(new CustomEvent("curriculearn-storage-change"));
};
