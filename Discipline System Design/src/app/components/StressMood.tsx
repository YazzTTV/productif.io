import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { ArrowLeft } from 'lucide-react';

interface StressMoodProps {
  onNavigate: (screen: string) => void;
}

export function StressMood({ onNavigate }: StressMoodProps) {
  const [stress, setStress] = useState(50);
  const [energy, setEnergy] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  // Mock weekly data
  const weeklyData = [
    { day: 'Mon', stress: 45, energy: 68 },
    { day: 'Tue', stress: 52, energy: 62 },
    { day: 'Wed', stress: 38, energy: 72 },
    { day: 'Thu', stress: 42, energy: 70 },
    { day: 'Fri', stress: 35, energy: 75 },
    { day: 'Sat', stress: 28, energy: 82 },
    { day: 'Sun', stress: 32, energy: 78 },
  ];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#16A34A]/10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#16A34A]" />
          </div>
          <p className="text-black/60">Check-in recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Stress & Mood
          </h1>
        </div>
      </div>

      {/* Current check-in */}
      <div className="px-6 pt-8 pb-8">
        <div className="space-y-8">
          <div>
            <p className="text-black/60 mb-6">How are you feeling right now?</p>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Stress level</span>
                  <span className="text-black/40">
                    {stress < 33 ? 'Low' : stress < 66 ? 'Moderate' : 'High'}
                  </span>
                </div>
                <Slider
                  value={[stress]}
                  onValueChange={([value]) => setStress(value)}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Energy level</span>
                  <span className="text-black/40">
                    {energy < 33 ? 'Low' : energy < 66 ? 'Moderate' : 'High'}
                  </span>
                </div>
                <Slider
                  value={[energy]}
                  onValueChange={([value]) => setEnergy(value)}
                  max={100}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Weekly visualization */}
      <div className="px-6 py-8 border-t border-black/5">
        <p className="text-black/60 mb-6">This is how your week felt.</p>
        
        <div className="space-y-8">
          {/* Stress chart */}
          <div>
            <p className="text-black/40 mb-4">Stress</p>
            <div className="h-32 flex items-end justify-between gap-2">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-black/5 rounded-full relative h-full">
                    <div
                      className="absolute bottom-0 w-full bg-black/20 rounded-full"
                      style={{ height: `${data.stress}%` }}
                    />
                  </div>
                  <span className="text-black/40">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Energy chart */}
          <div>
            <p className="text-black/40 mb-4">Energy</p>
            <div className="h-32 flex items-end justify-between gap-2">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-[#16A34A]/10 rounded-full relative h-full">
                    <div
                      className="absolute bottom-0 w-full bg-[#16A34A] rounded-full"
                      style={{ height: `${data.energy}%` }}
                    />
                  </div>
                  <span className="text-black/40">{data.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 border border-black/5 rounded-3xl bg-white">
          <p className="text-black/60 text-center">
            Your stress is trending down. Energy is stable.
          </p>
        </div>
      </div>
    </div>
  );
}
