import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

interface TasksCalendarProps {
  onNavigate: (screen: string) => void;
}

export function TasksCalendar({ onNavigate }: TasksCalendarProps) {
  const [showEventModal, setShowEventModal] = useState(false);

  const tasks = [
    {
      id: 1,
      title: 'Complete Chapter 12 Summary',
      subject: 'Organic Chemistry',
      difficulty: 'Medium',
      priority: 'High',
      time: '90 min',
    },
    {
      id: 2,
      title: 'Review lecture notes',
      subject: 'Physics',
      difficulty: 'Easy',
      priority: 'Medium',
      time: '30 min',
    },
    {
      id: 3,
      title: 'Practice problems 15-20',
      subject: 'Mathematics',
      difficulty: 'Hard',
      priority: 'Medium',
      time: '45 min',
    },
    {
      id: 4,
      title: 'Read Case Study 3',
      subject: 'Law',
      difficulty: 'Medium',
      priority: 'Low',
      time: '60 min',
    },
  ];

  const timeBlocks = [
    { time: '09:00', task: 'Complete Chapter 12 Summary', subject: 'Organic Chemistry' },
    { time: '11:00', task: 'Review lecture notes', subject: 'Physics' },
    { time: '14:00', task: 'Practice problems 15-20', subject: 'Mathematics' },
    { time: '16:00', task: null, subject: null }, // Empty slot
  ];

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20';
      case 'Medium':
        return 'bg-black/5 text-black/60 border-black/10';
      case 'Hard':
        return 'bg-black/10 text-black/80 border-black/20';
      default:
        return 'bg-black/5 text-black/60 border-black/10';
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Tasks & Calendar
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex gap-2 p-1 bg-black/5 rounded-3xl">
          <button className="flex-1 py-3 bg-white rounded-3xl">
            Tasks
          </button>
          <button className="flex-1 py-3 text-black/60 hover:text-black">
            Calendar
          </button>
        </div>
      </div>

      {/* AI-prioritized tasks */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-black/60">AI-prioritized for today</p>
          <button className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-6 border border-black/5 rounded-3xl bg-white hover:border-black/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="mb-1">{task.title}</h3>
                  <p className="text-black/60">{task.subject}</p>
                </div>
                <div className={`px-3 py-1 rounded-full border ${difficultyColor(task.difficulty)}`}>
                  <span>{task.difficulty}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-black/60">
                  <span>~{task.time}</span>
                  <span>•</span>
                  <span className={task.priority === 'High' ? 'text-[#16A34A]' : ''}>
                    {task.priority} priority
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-full px-6"
                >
                  Start
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time blocks preview */}
      <div className="px-6 mb-6">
        <p className="text-black/60 mb-4">AI-proposed schedule</p>
        <div className="space-y-3">
          {timeBlocks.map((block, i) => (
            <div
              key={i}
              onClick={() => block.task && setShowEventModal(true)}
              className={`p-6 rounded-3xl flex items-center gap-6 ${
                block.task
                  ? 'border border-[#16A34A]/20 bg-[#16A34A]/5 cursor-pointer hover:bg-[#16A34A]/10'
                  : 'border border-dashed border-black/10'
              }`}
            >
              <div className="text-black/60 w-16">{block.time}</div>
              {block.task ? (
                <div className="flex-1">
                  <p className="mb-1">{block.task}</p>
                  <p className="text-black/60">{block.subject}</p>
                </div>
              ) : (
                <p className="text-black/40">Available slot</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event completion modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-8 space-y-6">
            <h3 className="tracking-tight text-center" style={{ letterSpacing: '-0.04em' }}>
              Was this completed?
            </h3>
            
            <div className="space-y-3">
              <Button
                onClick={() => setShowEventModal(false)}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
              >
                Yes
              </Button>
              <Button
                onClick={() => setShowEventModal(false)}
                variant="outline"
                className="w-full rounded-3xl h-14 border-black/10"
              >
                Partially
              </Button>
              <Button
                onClick={() => setShowEventModal(false)}
                variant="ghost"
                className="w-full rounded-3xl h-14 text-black/60"
              >
                No (auto-reschedule)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
