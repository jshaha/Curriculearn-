"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument, updateDocument } from "@/lib/storage";
import { api } from "@/lib/api";
import { PipelineProgress, ANALYZE_STAGES } from "@/components/PipelineProgress";

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
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    // Clear the file input
    e.target.value = "";
  };

  // One-click demo for visitors without a lesson file on hand.
  const handleSample = async () => {
    setError(null);
    try {
      const res = await fetch("/samples/photosynthesis-lesson.txt");
      if (!res.ok) throw new Error("Couldn't load the sample lesson");
      const blob = await res.blob();
      await processFile(new File([blob], "Photosynthesis (sample).txt", { type: "text/plain" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the sample lesson");
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    let docId: string | null = null;
    try {
      // Create the document immediately with "uploading" status.
      const newDoc = await createDocument({
        classId,
        filename: file.name,
        status: "uploading",
      });
      docId = newDoc.id;

      console.log("Uploading file to backend:", file.name);

      // Upload to backend → parsed lesson content (backend is stateless).
      const uploadResult = await api.upload(file);
      console.log("Upload successful:", uploadResult.title);

      // Analyze to get real metrics + Claude diagnoses.
      console.log("Analyzing lesson...");
      const analyzeResult = await api.analyze(uploadResult.content);
      console.log("Analysis complete:", analyzeResult);

      // Persist parsed content + results so analyze/optimize work after restarts.
      await updateDocument(docId, {
        status: "complete",
        content: uploadResult.content,
        metrics: analyzeResult.metrics,
        diagnoses: analyzeResult.issues,
      });

      if (onUploadComplete) {
        onUploadComplete(docId, analyzeResult.metrics);
      }

      // Take the user straight to the analysis; the per-section document lists
      // are easy to miss on a first visit.
      router.push(`/class/${classId}/document/${docId}`);
    } catch (err) {
      if (docId) {
        try {
          await updateDocument(docId, { status: "error" });
        } catch {
          /* ignore */
        }
      }
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
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
              <span>Analyzing...</span>
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

      {!isUploading && (
        <button
          onClick={handleSample}
          className="mt-2 w-full text-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg/55 underline-offset-4 transition-colors hover:text-accent hover:underline"
        >
          or try a sample lesson
        </button>
      )}

      {isUploading && (
        <div className="mt-3 w-[300px]">
          <PipelineProgress
            stages={ANALYZE_STAGES}
            note="About a minute. Longer if the server is waking up."
          />
        </div>
      )}

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
