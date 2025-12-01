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
import { Header } from './components/Header';
import { Language, useTranslation } from './utils/translations';

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

  const t = useTranslation(selectedLanguage);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const questions = [
    {
      question: t('onboardingQ1'),
      options: [
        { id: 'A', text: t('onboardingQ1A') },
        { id: 'B', text: t('onboardingQ1B') },
        { id: 'C', text: t('onboardingQ1C') },
        { id: 'D', text: t('onboardingQ1D') }
      ]
    },
    {
      question: t('onboardingQ2'),
      options: [
        { id: 'A', text: t('onboardingQ2A') },
        { id: 'B', text: t('onboardingQ2B') },
        { id: 'C', text: t('onboardingQ2C') },
        { id: 'D', text: t('onboardingQ2D') }
      ]
    },
    {
      question: t('onboardingQ3'),
      options: [
        { id: 'A', text: t('onboardingQ3A') },
        { id: 'B', text: t('onboardingQ3B') },
        { id: 'C', text: t('onboardingQ3C') },
        { id: 'D', text: t('onboardingQ3D') }
      ],
      socialProof: t('onboardingQ3Social')
    },
    {
      question: t('onboardingQ4'),
      options: [
        { id: 'A', text: t('onboardingQ4A') },
        { id: 'B', text: t('onboardingQ4B') },
        { id: 'C', text: t('onboardingQ4C') },
        { id: 'D', text: t('onboardingQ4D') }
      ],
      socialProof: t('onboardingQ4Social')
    },
    {
      question: t('onboardingQ5'),
      options: [
        { id: 'A', text: t('onboardingQ5A') },
        { id: 'B', text: t('onboardingQ5B') },
        { id: 'C', text: t('onboardingQ5C') },
        { id: 'D', text: t('onboardingQ5D') }
      ]
    },
    {
      question: t('onboardingQ6'),
      options: [
        { id: 'A', text: t('onboardingQ6A') },
        { id: 'B', text: t('onboardingQ6B') },
        { id: 'C', text: t('onboardingQ6C') },
        { id: 'D', text: t('onboardingQ6D') }
      ]
    }
  ];

  const profileTypes: { [key: string]: { type: string; emoji: string; description: string } } = {
    'AAAA': {
      type: t('profileFocusedPerfectionist'),
      emoji: '🎯',
      description: t('profileFocusedPerfectionistDesc')
    },
    'BBBB': {
      type: t('profileOverwhelmedStrategist'),
      emoji: '🔥',
      description: t('profileOverwhelmedStrategistDesc')
    },
    'CCCC': {
      type: t('profileDeterminedScatterbrain'),
      emoji: '🌀',
      description: t('profileDeterminedScatterbrainDesc')
    },
    'DDDD': {
      type: t('profileMotivatedExplorer'),
      emoji: '🚀',
      description: t('profileMotivatedExplorerDesc')
    },
    'default': {
      type: t('profileAmbitiousAchiever'),
      emoji: '💭',
      description: t('profileAmbitiousAchieverDesc')
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
        return <WelcomePage onNavigate={navigateTo} language={selectedLanguage} />;
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
        return <BuildingPlanScreen onComplete={() => navigateTo('symptoms-analysis')} language={selectedLanguage} />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="w-full min-h-screen bg-white">
        <div className="w-full h-full">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}