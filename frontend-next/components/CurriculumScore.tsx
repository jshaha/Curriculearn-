"use client";

import { useEffect, useState } from "react";
import { getDocuments, type DocumentMetadata } from "@/lib/storage";

interface CurriculumScoreProps {
  classId: string;
}

export const CurriculumScore = ({ classId }: CurriculumScoreProps): JSX.Element => {
  const [score, setScore] = useState<number | null>(null);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    const calculateScore = () => {
      const classDocs = getDocuments(classId).filter(
        (doc) => doc.status === "complete" && doc.metrics
      );

      if (classDocs.length === 0) {
        setScore(null);
        setDocCount(0);
        return;
      }

      const totalScore = classDocs.reduce(
        (sum, doc) => sum + (doc.metrics?.learning_score || 0),
        0
      );
      const avgScore = Math.round(totalScore / classDocs.length);

      setScore(avgScore);
      setDocCount(classDocs.length);
    };

    calculateScore();

    // Listen for storage changes
    const handleStorageChange = () => calculateScore();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [classId]);

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null
    ? circumference * (1 - score / 100)
    : circumference;

  const getScoreColor = (s: number | null) => {
    if (s === null) return "text-fg/30";
    if (s >= 75) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Circle Score */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="h-20 w-20 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-fg/10"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-700 ${getScoreColor(score)}`}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-lg font-semibold ${getScoreColor(score)}`}>
            {score !== null ? score : "—"}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg/50">
          Curriculum
        </div>
        {docCount > 0 && (
          <div className="font-mono text-[0.5rem] text-fg/30">
            {docCount} doc{docCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};
