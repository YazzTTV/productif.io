import type { StudyAnalysis } from "./studyAnalysis";

/** Aggregate long analysis periods into complete weekly buckets. */
export function chartData(daily: StudyAnalysis["daily"], days: number) {
  const bucketSize = days >= 30 ? 7 : 1;
  if (bucketSize === 1) return daily.map((day) => ({ ...day, endDate: day.date }));
  return Array.from({ length: Math.ceil(daily.length / bucketSize) }, (_, index) => {
    const bucket = daily.slice(index * bucketSize, (index + 1) * bucketSize);
    return {
      date: bucket[0]?.date ?? "",
      endDate: bucket[bucket.length - 1]?.date ?? "",
      seconds: bucket.reduce((sum, day) => sum + day.seconds, 0),
      checkins: [],
    };
  });
}
