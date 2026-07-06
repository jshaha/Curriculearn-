// Document persistence backed by Supabase (per-user via row-level security).
// Every visitor is an anonymous auth user, so their documents are isolated.

"use client";

import { supabase, ensureAuth } from "./supabase";
import type { Diagnosis } from "./api";

export type DocumentStatus =
  | "uploading"
  | "complete"
  | "optimizing"
  | "optimized"
  | "error";

export interface DocumentMetadata {
  id: string;
  filename: string;
  classId: string;
  content?: unknown; // parsed lesson segments (StructuredLesson) returned by the backend
  uploadDate: string;
  status: DocumentStatus;
  metrics?: any;
  optimizedMetrics?: any;
  optimizationResultId?: string;
  diagnoses?: Diagnosis[];
}

// Notify same-window listeners (DocumentList, CurriculumScore) that data changed.
const emitStorageChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("curriculearn-storage-change"));
  }
};

// Map a Supabase row to the DocumentMetadata shape the UI uses.
type DocumentRow = {
  id: string;
  class_id: string;
  filename: string;
  content: unknown;
  status: DocumentStatus;
  metrics: any;
  optimized_metrics: any;
  diagnoses: Diagnosis[] | null;
  optimization_result_id?: string | null;
  created_at: string;
};

const rowToDoc = (row: DocumentRow): DocumentMetadata => ({
  id: row.id,
  filename: row.filename,
  classId: row.class_id,
  content: row.content ?? undefined,
  uploadDate: row.created_at,
  status: row.status,
  metrics: row.metrics ?? undefined,
  optimizedMetrics: row.optimized_metrics ?? undefined,
  optimizationResultId: row.optimization_result_id ?? undefined,
  diagnoses: row.diagnoses ?? undefined,
});

const SELECT_COLS =
  "id,class_id,filename,content,status,metrics,optimized_metrics,diagnoses,created_at";

export const getDocuments = async (classId: string): Promise<DocumentMetadata[]> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT_COLS)
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DocumentRow[]).map(rowToDoc);
};

export const getDocument = async (docId: string): Promise<DocumentMetadata | null> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("documents")
    .select(SELECT_COLS)
    .eq("id", docId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDoc(data as DocumentRow) : null;
};

export interface CreateDocumentInput {
  classId: string;
  filename: string;
  status?: DocumentStatus;
  content?: unknown;
}

export const createDocument = async (
  input: CreateDocumentInput
): Promise<DocumentMetadata> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      class_id: input.classId,
      filename: input.filename,
      status: input.status ?? "uploading",
      content: input.content ?? null,
    })
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  emitStorageChange();
  return rowToDoc(data as DocumentRow);
};

export const updateDocument = async (
  docId: string,
  updates: Partial<
    Pick<
      DocumentMetadata,
      "status" | "metrics" | "optimizedMetrics" | "diagnoses" | "content"
    >
  >
): Promise<void> => {
  await ensureAuth();
  const patch: Record<string, unknown> = {};
  if ("status" in updates) patch.status = updates.status;
  if ("metrics" in updates) patch.metrics = updates.metrics;
  if ("optimizedMetrics" in updates) patch.optimized_metrics = updates.optimizedMetrics;
  if ("diagnoses" in updates) patch.diagnoses = updates.diagnoses;
  if ("content" in updates) patch.content = updates.content;

  const { error } = await supabase.from("documents").update(patch).eq("id", docId);
  if (error) throw error;
  emitStorageChange();
};

export const deleteDocument = async (docId: string): Promise<void> => {
  await ensureAuth();
  const { error } = await supabase.from("documents").delete().eq("id", docId);
  if (error) throw error;
  emitStorageChange();
};
