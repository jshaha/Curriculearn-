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

      // Add document to storage immediately with "uploading" status
      const newDoc = {
        id: docId,
        filename: file.name,
        classId,
        lessonId: "", // Will be set after upload
        uploadDate: new Date().toISOString(),
        status: "uploading" as const,
      };
      addDocument(newDoc);

      console.log("Uploading file to backend:", file.name);

      // Upload to backend and get real lesson_id
      const uploadResult = await api.upload(file);
      console.log("Upload successful, lesson_id:", uploadResult.lesson_id);

      // Analyze to get real metrics
      console.log("Analyzing lesson...");
      const analyzeResult = await api.analyze(uploadResult.lesson_id);
      console.log("Analysis complete:", analyzeResult);

      // Update document with complete status, real metrics, and Claude diagnoses
      const updatedDoc = {
        ...newDoc,
        lessonId: uploadResult.lesson_id,
        status: "complete" as const,
        metrics: analyzeResult.metrics,
        diagnoses: analyzeResult.issues, // Save Claude diagnoses!
      };

      // Replace the uploading doc with complete doc
      // Note: addDocument now automatically dispatches the storage change event
      addDocument(updatedDoc);

      if (onUploadComplete) {
        onUploadComplete(docId, analyzeResult.metrics);
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
    <div className="z-50">
      <label className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg border border-[#FF8A1A]/30 bg-gradient-to-br from-[#FF8A1A]/90 via-[#FF8A1A]/80 to-[#FF9A2A]/90 px-5 py-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_24px_rgba(255,138,26,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-[#FF8A1A]/50 hover:shadow-[0_8px_32px_rgba(255,138,26,0.35)] disabled:cursor-not-allowed disabled:opacity-60">
        {/* Glass reflection effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60" />

        {/* Animated shimmer */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        <input
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          accept=".pdf,.txt,.md,.doc,.docx,.pptx"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          {isUploading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Material</span>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-3 overflow-hidden rounded-lg border border-red-500/30 bg-red-500/10 backdrop-blur-xl">
          <div className="px-4 py-2.5 font-mono text-[0.68rem] text-red-400">
            {error}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
};
