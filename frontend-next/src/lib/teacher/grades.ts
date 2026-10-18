/** Percentage -> letter grade and CGPA (same table as the old calculateGrade()). */
export function calculateGrade(total: number): { grade: string; cgpa: number } {
  if (total >= 90) return { grade: "A+", cgpa: 4.0 };
  if (total >= 86) return { grade: "A", cgpa: 3.67 };
  if (total >= 82) return { grade: "A-", cgpa: 3.33 };
  if (total >= 78) return { grade: "B+", cgpa: 3.0 };
  if (total >= 74) return { grade: "B", cgpa: 2.67 };
  if (total >= 70) return { grade: "B-", cgpa: 2.33 };
  if (total >= 66) return { grade: "C+", cgpa: 2.0 };
  if (total >= 62) return { grade: "C", cgpa: 1.67 };
  if (total >= 58) return { grade: "D+", cgpa: 1.33 };
  if (total >= 50) return { grade: "D", cgpa: 1.0 };
  return { grade: "F", cgpa: 0.0 };
}

export const MARK_LIMITS = { quiz: 15, assignment: 15, mid: 30, final: 40 } as const;
