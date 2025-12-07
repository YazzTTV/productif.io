import { useState } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { QuizPage } from './components/QuizPage';
import { ProcessingPage } from './components/ProcessingPage';
import { ProfileResultPage } from './components/ProfileResultPage';
import { DashboardPage } from './components/DashboardPage';
import { AssistantPage } from './components/AssistantPage';
import { TrackerPage } from './components/TrackerPage';
import { SettingsPage } from './components/SettingsPage';
import { IntroScreen } from './components/IntroScreen';
import { ConnectionPage } from './components/ConnectionPage';
import { ProfileSetupPage } from './components/ProfileSetupPage';
import { OnboardingQuestion } from './components/OnboardingQuestion';
import { BuildingPlanScreen } from './components/BuildingPlanScreen';
import { ProfileRevealScreen } from './components/ProfileRevealScreen';
import { SymptomsAnalysisPage } from './components/SymptomsAnalysisPage';
import { TasksPage } from './components/TasksPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { AchievementsPage } from './components/AchievementsPage';
import { LanguageSelectionPage } from './components/LanguageSelectionPage';
import { SocialProofPage } from './components/SocialProofPage';
import { Language } from './utils/translations';

export type Screen = 
  | 'welcome' 
  | 'language'
  | 'login' 
  | 'quiz' 
  | 'processing' 
  | 'profile' 
  | 'dashboard' 
  | 'assistant' 
  | 'tracker'
  | 'settings'
  | 'intro'
  | 'connection'
  | 'profile-setup'
  | 'onboarding-1'
  | 'onboarding-2'
  | 'onboarding-3'
  | 'onboarding-4'
  | 'onboarding-5'
  | 'onboarding-6'
  | 'building-plan'
  | 'symptoms-analysis'
  | 'social-proof'
  | 'profile-reveal'
  | 'tasks'
  | 'analytics'
  | 'leaderboard'
  | 'achievements';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
  const [quizProgress, setQuizProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [onboardingAnswers, setOnboardingAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

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
  ];

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
  };

  const handleOnboardingAnswer = (answer: string) => {
    const newAnswers = [...onboardingAnswers, answer];
    setOnboardingAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentScreen(`onboarding-${nextIndex + 1}` as Screen);
    } else {
      // Calculate profile
      const answerKey = newAnswers.join('');
      const profile = profileTypes[answerKey] || profileTypes['default'];
      setUserProfile(profile);
      // Go to building plan screen first
      setCurrentScreen('building-plan');
    }
  };

  const handleBackToQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Remove last answer
      const newAnswers = onboardingAnswers.slice(0, -1);
      setOnboardingAnswers(newAnswers);
      
      // Go back to previous question
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentScreen(`onboarding-${prevIndex + 1}` as Screen);
    } else {
      // Go back to intro
      setCurrentScreen('intro');
      setOnboardingAnswers([]);
      setCurrentQuestionIndex(0);
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  const renderScreen = () => {
    const currentQuestion = getCurrentQuestion();
    
    switch (currentScreen) {
      case 'welcome':
        return <WelcomePage onNavigate={navigateTo} />;
      case 'language':
        return <LanguageSelectionPage onNavigate={navigateTo} onLanguageSelect={handleLanguageSelect} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} />;
      case 'quiz':
        return <QuizPage onNavigate={navigateTo} onProgressUpdate={setQuizProgress} onComplete={setUserProfile} />;
      case 'processing':
        return <ProcessingPage onNavigate={navigateTo} />;
      case 'profile':
        return <ProfileResultPage onNavigate={navigateTo} profile={userProfile} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigateTo} />;
      case 'assistant':
        return <AssistantPage onNavigate={navigateTo} />;
      case 'tracker':
        return <TrackerPage onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateTo} />;
      case 'intro':
        return <IntroScreen onNavigate={navigateTo} language={selectedLanguage} />;
      case 'connection':
        return <ConnectionPage onNavigate={navigateTo} language={selectedLanguage} />;
      case 'profile-setup':
        return <ProfileSetupPage onNavigate={navigateTo} />;
      case 'onboarding-1':
      case 'onboarding-2':
      case 'onboarding-3':
      case 'onboarding-4':
      case 'onboarding-5':
      case 'onboarding-6':
        return (
          <OnboardingQuestion
            key={currentQuestionIndex}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            question={currentQuestion.question}
            options={currentQuestion.options}
            onAnswer={handleOnboardingAnswer}
            socialProof={currentQuestion.socialProof}
            onBack={handleBackToQuestion}
          />
        );
      case 'building-plan':
        return <BuildingPlanScreen onComplete={() => navigateTo('symptoms-analysis')} />;
      case 'symptoms-analysis':
        return <SymptomsAnalysisPage onComplete={() => navigateTo('social-proof')} />;
      case 'social-proof':
        return <SocialProofPage onNavigate={navigateTo} />;
      case 'profile-reveal':
        return (
          <ProfileRevealScreen
            onNavigate={navigateTo}
            profileType={userProfile?.type || ''}
            profileEmoji={userProfile?.emoji || ''}
            description={userProfile?.description || ''}
          />
        );
      case 'tasks':
        return <TasksPage onNavigate={navigateTo} />;
      case 'analytics':
        return <AnalyticsPage onNavigate={navigateTo} />;
      case 'leaderboard':
        return <LeaderboardPage onNavigate={navigateTo} />;
      case 'achievements':
        return <AchievementsPage onNavigate={navigateTo} />;
      default:
        return <IntroScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      {/* iPhone Frame */}
      <div className="w-full max-w-[390px] h-[844px] bg-black rounded-[55px] p-3 shadow-2xl">
        {/* iPhone Screen */}
        <div className="w-full h-full bg-white rounded-[45px] overflow-hidden relative">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-11 bg-transparent z-50 flex items-start justify-between px-8 pt-2">
            <span className="text-sm">9:41</span>
            <div className="w-24 h-7 bg-black rounded-full -mt-2"></div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="21" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="23" y="9" width="1" height="6" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          {/* Screen Content */}
          <div className="w-full h-full overflow-y-auto">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}