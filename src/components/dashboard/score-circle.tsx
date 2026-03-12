'use client';

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

const GRADE_COLORS = {
  A: { bg: 'from-emerald-400 to-green-600', text: '#2a9d5c' },
  B: { bg: 'from-blue-400 to-blue-600', text: '#2b7cff' },
  C: { bg: 'from-yellow-400 to-amber-600', text: '#e8a117' },
  D: { bg: 'from-orange-400 to-orange-600', text: '#f97316' },
  F: { bg: 'from-red-400 to-red-600', text: '#dc3545' },
};

export default function ScoreCircle({ score, grade }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount += 1;
      current = increment * stepCount;

      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score]);

  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const gradeColor = GRADE_COLORS[grade];

  return (
    <div
      className="flex flex-col items-center justify-center"
      data-grade={grade}
      role="img"
      aria-label={`종합 점수: ${displayScore}점, 등급: ${grade}등급. 마케팅 건강도 평가`}
    >
      <svg
        width="200"
        height="200"
        className="mb-4"
        viewBox="0 0 200 200"
        aria-hidden="true"
        role="presentation"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#e2e6ea"
          strokeWidth="12"
        />

        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={gradeColor.text}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>

      {/* Center text */}
      <div className="absolute text-center">
        <div className="text-4xl font-bold" style={{ color: gradeColor.text }}>
          {displayScore}
        </div>
        <div className="text-5xl font-black" style={{ color: gradeColor.text }}>
          {grade}
        </div>
      </div>
    </div>
  );
}
