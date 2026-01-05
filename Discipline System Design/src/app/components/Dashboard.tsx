import { Button } from './ui/button';
import { Home, Target, Calendar, Brain, Users, Settings } from 'lucide-react';
import { CommunityProgressCard } from './CommunityProgressCard';

interface DashboardProps {
  userName: string;
  onNavigate: (screen: string) => void;
}

export function Dashboard({ userName, onNavigate }: DashboardProps) {
  const mainPriority = {
    title: 'Complete Chapter 12 Summary',
    subject: 'Organic Chemistry',
    difficulty: 'Medium',
    estimatedTime: '90 min',
  };

  const tasks = [
    { title: 'Review lecture notes', subject: 'Physics', time: '30 min' },
    { title: 'Practice problems 15-20', subject: 'Mathematics', time: '45 min' },
  ];

  const habits = [
    { title: 'Morning review session', completed: true },
    { title: 'Evening reflection', completed: false },
  ];

  const mentalState = {
    focus: 72,
    energy: 65,
    stress: 38,
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-black/40">Today</p>
            <h1 className="tracking-tight mt-1" style={{ letterSpacing: '-0.04em' }}>
              {userName}'s Ideal Day
            </h1>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mental State Indicator */}
      <div className="px-6 mb-8">
        <div className="p-6 border border-black/5 rounded-3xl bg-white">
          <p className="text-black/60 mb-4">Current state</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Focus</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] rounded-full"
                    style={{ width: `${mentalState.focus}%` }}
                  />
                </div>
                <span className="text-black/40 w-10 text-right">{mentalState.focus}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Energy</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] rounded-full"
                    style={{ width: `${mentalState.energy}%` }}
                  />
                </div>
                <span className="text-black/40 w-10 text-right">{mentalState.energy}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Stress</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black/20 rounded-full"
                    style={{ width: `${mentalState.stress}%` }}
                  />
                </div>
                <span className="text-black/40 w-10 text-right">{mentalState.stress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Priority */}
      <div className="px-6 mb-6">
        <p className="text-black/60 mb-3">Main priority</p>
        <div className="p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="mb-2">{mainPriority.title}</h3>
              <p className="text-black/60">{mainPriority.subject}</p>
            </div>
            <div className="px-3 py-1 bg-white rounded-full border border-black/5">
              <span className="text-black/60">{mainPriority.difficulty}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-black/60 mb-6">
            <span>~{mainPriority.estimatedTime}</span>
          </div>
          <Button
            onClick={() => onNavigate('focus')}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
          >
            Start focus
          </Button>
        </div>
      </div>

      {/* System-selected tasks */}
      <div className="px-6 mb-6">
        <p className="text-black/60 mb-3">Also scheduled</p>
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between"
            >
              <div>
                <p className="mb-1">{task.title}</p>
                <p className="text-black/40">{task.subject}</p>
              </div>
              <span className="text-black/40">{task.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habits */}
      <div className="px-6 mb-6">
        <p className="text-black/60 mb-3">Today's habits</p>
        <div className="space-y-3">
          {habits.map((habit, i) => (
            <div
              key={i}
              className={`p-6 border rounded-3xl flex items-center gap-4 ${
                habit.completed
                  ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                  : 'border-black/5 bg-white'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                habit.completed
                  ? 'border-[#16A34A] bg-[#16A34A]'
                  : 'border-black/20'
              }`}>
                {habit.completed && (
                  <div className="w-3 h-3 rounded-full bg-white" />
                )}
              </div>
              <span className={habit.completed ? 'text-black/60' : ''}>{habit.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community Progress Card */}
      <div className="px-6 mb-6">
        <CommunityProgressCard onNavigate={onNavigate} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex flex-col items-center gap-1 text-[#16A34A]"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('tasks')}
            className="flex flex-col items-center gap-1 text-black/40"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Tasks</span>
          </button>
          <button
            onClick={() => onNavigate('ai')}
            className="flex flex-col items-center gap-1 text-black/40"
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs">Agent</span>
          </button>
          <button
            onClick={() => onNavigate('stress')}
            className="flex flex-col items-center gap-1 text-black/40"
          >
            <Target className="w-6 h-6" />
            <span className="text-xs">Mood</span>
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className="flex flex-col items-center gap-1 text-black/40"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}