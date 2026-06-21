"use client";

import { useState } from "react";
import { addDocument } from "@/lib/storage";
import { api } from "@/lib/api";

interface MaterialUploadProps {
  classId: string;
  className: string;
  onUploadComplete?: (fileId: string, analysis: any) => void;
}

export const MaterialUpload = ({
  classId,
  className,
  onUploadComplete
}: MaterialUploadProps): JSX.Element => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const docId = `doc-${Date.now()}`;
      const lessonId = `lesson-${Date.now()}`;

      // Add document to storage immediately with "uploading" status
      const newDoc = {
        id: docId,
        filename: file.name,
        classId,
        lessonId,
        uploadDate: new Date().toISOString(),
        status: "uploading" as const,
      };
      addDocument(newDoc);

      // Simulate backend upload and analysis
      console.log("Uploading file:", file.name, "for class:", classId);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock metrics for demo
      const mockMetrics = {
        learning_score: Math.floor(Math.random() * 30) + 70,
        engagement: Math.floor(Math.random() * 30) + 65,
        cognitive_load: Math.floor(Math.random() * 40) + 50,
        concept_flow: Math.floor(Math.random() * 30) + 65,
        retention: Math.floor(Math.random() * 30) + 60,
        novelty: Math.floor(Math.random() * 30) + 60,
        information_density: Math.floor(Math.random() * 30) + 65,
        reinforcement: Math.floor(Math.random() * 30) + 60,
        multimodal_support: Math.floor(Math.random() * 30) + 55,
      };

      // Update document with complete status and metrics
      const updatedDoc = {
        ...newDoc,
        status: "complete" as const,
        metrics: mockMetrics,
      };

      // Replace the uploading doc with complete doc
      addDocument(updatedDoc);

      // Trigger storage event for DocumentList to refresh
      window.dispatchEvent(new Event("storage"));

      if (onUploadComplete) {
        onUploadComplete(docId, mockMetrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = "";
    }
  };

  return (
    <div className="fixed top-8 right-8 z-50">
      <label className="group relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-[#FF8A1A] bg-[#FF8A1A] px-5 py-3 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-black shadow-lg transition-all duration-300 hover:bg-[#FF8A1A]/90 hover:shadow-[0_0_20px_rgba(255,138,26,0.4)]">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          accept=".pdf,.txt,.md,.doc,.docx"
        />
        {isUploading ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <span className="text-lg">+</span>
            <span>Upload Material</span>
          </>
        )}
      </label>

      {error && (
        <div className="mt-2 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[0.65rem] text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};
