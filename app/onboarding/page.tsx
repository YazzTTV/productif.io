"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingQuestion } from '@/components/onboarding/onboarding-question'
import { ProcessingPage } from '@/components/onboarding/processing-page'
import { ProfileRevealScreen } from '@/components/onboarding/profile-reveal-screen'

const questions = [
  {
    question: "When you work on an important project, you tend to…",
    options: [
      { id: 'A', text: "Get lost in details" },
      { id: 'B', text: "Procrastinate" },
      { id: 'C', text: "Jump between tasks" },
      { id: 'D', text: "Start strong, then lose motivation" }
    ]
  },
  {
    question: "At the end of your day, you usually feel…",
    options: [
      { id: 'A', text: "Frustrated for not doing enough" },
      { id: 'B', text: "Tired without knowing why" },
      { id: 'C', text: "Proud, but unclear about the big picture" },
      { id: 'D', text: "Lost in your priorities" }
    ]
  },
  {
    question: "Your phone while working is…",
    options: [
      { id: 'A', text: "My worst enemy" },
      { id: 'B', text: "'Just 2 minutes'… then 2 hours later" },
      { id: 'C', text: "I put it away but take it back" },
      { id: 'D', text: "I've learned to manage it" }
    ],
    socialProof: "You're not alone — 92% of Productif.io users had the same issue before starting."
  },
  {
    question: "When do you feel most productive?",
    options: [
      { id: 'A', text: "Early morning (5am-9am)" },
      { id: 'B', text: "Midday (10am-2pm)" },
      { id: 'C', text: "Afternoon/Evening (3pm-8pm)" },
      { id: 'D', text: "Late night (9pm+)" }
    ],
    socialProof: "Understanding your peak hours helps us optimize your schedule for maximum focus."
  },
  {
    question: "How do you handle breaks during work?",
    options: [
      { id: 'A', text: "I forget to take them" },
      { id: 'B', text: "Short breaks turn into long ones" },
      { id: 'C', text: "I take them but feel guilty" },
      { id: 'D', text: "I schedule them strategically" }
    ]
  },
  {
    question: "What's your main goal right now?",
    options: [
      { id: 'A', text: "Grow my business/project" },
      { id: 'B', text: "Manage my studies better" },
      { id: 'C', text: "Build discipline" },
      { id: 'D', text: "Find work-life balance" }
    ]
  }
]

const profileTypes: { [key: string]: { type: string; emoji: string; description: string } } = {
  'AAAA': {
    type: 'The Focused Perfectionist',
    emoji: '🎯',
    description: "You have incredible attention to detail and high standards. What's missing is knowing when to move forward. Productif.io helps you balance perfection with progress."
  },
  'BBBB': {
    type: 'The Overwhelmed Strategist',
    emoji: '🔥',
    description: "You have ambitious goals but struggle with execution. What's missing is a clear action plan. Productif.io turns your vision into daily wins."
  },
  'CCCC': {
    type: 'The Determined Scatterbrain',
    emoji: '🌀',
    description: "You have the energy and ambition — what's missing is clarity and structure. Productif.io helps you turn your chaos into focus with your personal AI coach."
  },
  'DDDD': {
    type: 'The Motivated Explorer',
    emoji: '🚀',
    description: "You start strong and love new challenges. What's missing is sustainable momentum. Productif.io keeps you engaged and on track every day."
  },
  'default': {
    type: 'The Ambitious Achiever',
    emoji: '💭',
    description: "You have the drive and potential — what's missing is the right system. Productif.io provides the structure and insights to help you reach your goals consistently."
  }
}

type OnboardingStep = 'questions' | 'processing' | 'profile'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get('step') as OnboardingStep | null
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(step || 'questions')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<{ type: string; emoji: string; description: string } | null>(null)

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate profile
      const answerKey = newAnswers.join('')
      const profile = profileTypes[answerKey] || profileTypes['default']
      setUserProfile(profile)
      setCurrentStep('processing')
      router.push('/onboarding?step=processing')
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const newAnswers = answers.slice(0, -1)
      setAnswers(newAnswers)
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      router.push('/onboarding/intro')
    }
  }

  const handleProcessingComplete = () => {
    setCurrentStep('profile')
    router.push('/onboarding?step=profile')
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (currentStep === 'processing') {
    return <ProcessingPage onComplete={handleProcessingComplete} />
  }

  if (currentStep === 'profile' && userProfile) {
    return (
      <ProfileRevealScreen
        profileType={userProfile.type}
        profileEmoji={userProfile.emoji}
        description={userProfile.description}
      />
    )
  }

  return (
    <OnboardingQuestion
      key={currentQuestionIndex}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      question={currentQuestion.question}
      options={currentQuestion.options}
      onAnswer={handleAnswer}
      onBack={handleBack}
      socialProof={currentQuestion.socialProof}
    />
  )
}
