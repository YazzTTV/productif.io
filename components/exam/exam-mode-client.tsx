"use client"

import { ExamMode } from "@/components/exam/exam-mode"
import { PreviewWrapper } from "@/components/premium/preview-wrapper"
import { useRouter } from "next/navigation"

interface ExamModeClientProps {
  isPremium: boolean
}

export function ExamModeClient({ isPremium }: ExamModeClientProps) {
  const router = useRouter()

  const handleExit = () => {
    router.push('/dashboard')
  }

  return (
    <PreviewWrapper
      isPremium={isPremium}
      featureName="Exam Mode"
      description="Stress-aware focus sessions optimized for exam preparation"
      benefits={[
        "Adaptive session durations based on stress level",
        "Priority-based task selection",
        "Micro-reassurance messages",
        "Exam countdown and preparation tracking"
      ]}
    >
      <ExamMode onExit={handleExit} />
    </PreviewWrapper>
  )
}

