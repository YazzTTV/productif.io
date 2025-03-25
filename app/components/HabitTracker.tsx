import { format, startOfToday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Habit, HabitEntry } from '@prisma/client';

interface HabitTrackerProps {
  habits: (Habit & {
    entries: HabitEntry[];
  })[];
  onToggleHabit: (habitId: string, date: Date, completed: boolean) => void;
}

export default function HabitTracker({ habits, onToggleHabit }: HabitTrackerProps) {
  const today = startOfToday();
  const dates = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Habitude
            </th>
            {dates.map((date) => (
              <th
                key={date.toISOString()}
                className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {format(date, 'EEE dd', { locale: fr })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {habits.map((habit) => (
            <tr key={habit.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: habit.color }} />
                {habit.name}
              </td>
              {dates.map((date) => {
                const entry = habit.entries.find(
                  (e) => format(new Date(e.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                );
                return (
                  <td
                    key={date.toISOString()}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    <button
                      onClick={() => onToggleHabit(habit.id, date, !entry?.completed)}
                      className={`w-6 h-6 rounded ${
                        entry?.completed
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {entry?.completed && (
                        <svg
                          className="w-4 h-4 mx-auto text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 