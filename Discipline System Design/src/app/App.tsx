import { useState } from 'react';
import { Onboarding } from './components/onboarding/Onboarding';
import { DashboardEnhanced } from './components/DashboardEnhanced';
import { FocusFlow } from './components/FocusFlow';
import { ExamMode } from './components/ExamMode';
import { PlanMyDay } from './components/PlanMyDay';
import { ReviewHabits } from './components/ReviewHabits';
import { DailyJournal } from './components/DailyJournal';
import { TasksCalendar } from './components/TasksCalendar';
import { Tasks } from './components/Tasks';
import { StressMood } from './components/StressMood';
import { AIAgentConductor } from './components/AIAgentConductor';
import { LeaderboardEnhanced } from './components/LeaderboardEnhanced';
import { CommunityInvite } from './components/CommunityInvite';
import { Paywall } from './components/Paywall';
import { Settings } from './components/Settings';

type Screen = 
  | 'onboarding'
  | 'dashboard'
  | 'focus'
  | 'exam'
  | 'plan'
  | 'habits'
  | 'journal'
  | 'tasks'
  | 'stress'
  | 'ai'
  | 'leaderboard'
  | 'invite'
  | 'paywall'
  | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [userData, setUserData] = useState<any>({});
  const [isPremium, setIsPremium] = useState(false); // Mock premium state

  const handleOnboardingComplete = (data: any) => {
    setUserData(data);
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;
      case 'dashboard':
        return (
          <DashboardEnhanced 
            userName={userData.firstName || 'Student'} 
            onNavigate={setCurrentScreen} 
          />
        );
      case 'focus':
        return <FocusFlow onExit={() => setCurrentScreen('dashboard')} onShowPaywall={() => setCurrentScreen('paywall')} />;
      case 'exam':
        return <ExamMode onExit={() => setCurrentScreen('dashboard')} />;
      case 'plan':
        return (
          <PlanMyDay 
            onComplete={() => setCurrentScreen('dashboard')} 
            onBack={() => setCurrentScreen('ai')} 
          />
        );
      case 'habits':
        return (
          <ReviewHabits 
            onComplete={() => setCurrentScreen('ai')} 
            onBack={() => setCurrentScreen('ai')} 
          />
        );
      case 'journal':
        return (
          <DailyJournal 
            onComplete={() => setCurrentScreen('ai')} 
            onBack={() => setCurrentScreen('ai')} 
          />
        );
      case 'tasks':
        return <Tasks onNavigate={setCurrentScreen} />;
      case 'stress':
        return <StressMood onNavigate={setCurrentScreen} />;
      case 'ai':
        return (
          <AIAgentConductor 
            userName={userData.firstName || 'Student'} 
            onNavigate={setCurrentScreen} 
          />
        );
      case 'leaderboard':
        return <LeaderboardEnhanced onNavigate={setCurrentScreen} isPremium={isPremium} />;
      case 'invite':
        return (
          <CommunityInvite 
            onNavigate={setCurrentScreen}
            userName={userData.firstName || 'Student'}
            userStats={{ streak: 9, xp: 2654, focusSessions: 15 }}
          />
        );
      case 'paywall':
        return <Paywall onNavigate={setCurrentScreen} />;
      case 'settings':
        return <Settings onNavigate={setCurrentScreen} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {renderScreen()}
    </div>
  );
}