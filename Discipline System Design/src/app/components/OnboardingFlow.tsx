import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import productifLogo from 'figma:asset/74a73e97503d2c70426e85e4615331f23c885101.png';

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    familiarProblems: [] as string[],
    firstName: '',
    ageRange: '',
    fieldOfStudy: '',
    currentSituation: '',
    dailyStruggles: [] as string[],
    mentalLoad: 50,
    focusQuality: 50,
    satisfaction: 50,
    overthinkTasks: null as boolean | null,
    shouldDoMore: null as boolean | null,
    wantToChange: [] as string[],
    timeHorizon: '',
  });

  // Auto-advance from screen 10 to 11 after 2 seconds
  useEffect(() => {
    if (step === 10) {
      const timer = setTimeout(() => {
        setStep(11);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const nextStep = () => {
    if (step === 12) {
      onComplete(data);
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateData = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  const toggleMultiple = (key: string, value: string) => {
    const current = data[key as keyof typeof data] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateData(key, updated);
  };

  // Screen 1 - Value Proposition
  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full space-y-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex justify-center"
          >
            <img 
              src={productifLogo} 
              alt="Productif.io" 
              className="w-24 h-24"
            />
          </motion.div>
          
          <div className="space-y-4 text-center">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              You work hard. But without a system.
            </h1>
            <p className="text-black/60">
              Productif.io helps students turn effort into results — without burnout.
            </p>
          </div>

          <Button 
            onClick={nextStep}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Screen 2 - Problem Mirror
  if (step === 2) {
    const problems = [
      "I work long hours but still feel behind",
      "I don't know what to prioritize",
      "My brain feels constantly overloaded",
      "I procrastinate even when motivated",
      "My days end without satisfaction",
    ];

    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Which of these feel familiar?
            </h2>
            
            <div className="space-y-3">
              {problems.map((problem) => (
                <button
                  key={problem}
                  onClick={() => toggleMultiple('familiarProblems', problem)}
                  className={`w-full p-6 border rounded-3xl text-left transition-all ${
                    data.familiarProblems.includes(problem)
                      ? 'border-[#16A34A] bg-[#16A34A]/5'
                      : 'border-black/5 hover:border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      data.familiarProblems.includes(problem)
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-black/20'
                    }`}>
                      {data.familiarProblems.includes(problem) && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1">{problem}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3 - Social Proof
  if (step === 3) {
    const testimonials = [
      "I finally know what to work on every day.",
      "My stress dropped without working more.",
      "I stopped overthinking and started executing.",
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-8 border border-black/5 rounded-3xl bg-white"
              >
                <p className="text-center mb-4">"{testimonial}"</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-black/60">
            Used by serious students under pressure.
          </p>

          <div className="space-y-3">
            <Button 
              onClick={nextStep}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 4 - Identity
  if (step === 4) {
    const ageRanges = ['16–18', '18–22', '22–26', '26–30'];
    const fields = ['Prepa', 'Medicine / Health', 'Law', 'Engineering', 'Business', 'Other'];

    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Let's personalize your system.
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input
                  value={data.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  className="rounded-3xl h-14 border-black/5 bg-white"
                />
              </div>

              <div className="space-y-3">
                <Label>Age range</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ageRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => updateData('ageRange', range)}
                      className={`p-4 border rounded-3xl transition-all ${
                        data.ageRange === range
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Field of study</Label>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <button
                      key={field}
                      onClick={() => updateData('fieldOfStudy', field)}
                      className={`w-full p-4 border rounded-3xl transition-all ${
                        data.fieldOfStudy === field
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              disabled={!data.firstName || !data.ageRange || !data.fieldOfStudy}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 5 - Academic Context
  if (step === 5) {
    const situations = [
      'Preparing for major exams',
      'Maintaining consistency',
      'Catching up',
      'Performing at a high level',
      'Managing stress while staying efficient',
    ];

    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              What best describes your current situation?
            </h2>
            
            <div className="space-y-3">
              {situations.map((situation) => (
                <button
                  key={situation}
                  onClick={() => updateData('currentSituation', situation)}
                  className={`w-full p-6 border rounded-3xl text-left transition-all ${
                    data.currentSituation === situation
                      ? 'border-[#16A34A] bg-[#16A34A]/5'
                      : 'border-black/5 hover:border-black/10'
                  }`}
                >
                  {situation}
                </button>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              disabled={!data.currentSituation}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 6 - Daily Struggles
  if (step === 6) {
    const struggles = [
      'Too many tasks in my head',
      'Difficulty focusing deeply',
      'Constant stress',
      'Feeling guilty when resting',
      'Fear of falling behind others',
    ];

    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              What makes your days difficult?
            </h2>
            
            <div className="space-y-3">
              {struggles.map((struggle) => (
                <button
                  key={struggle}
                  onClick={() => toggleMultiple('dailyStruggles', struggle)}
                  className={`w-full p-6 border rounded-3xl text-left transition-all ${
                    data.dailyStruggles.includes(struggle)
                      ? 'border-[#16A34A] bg-[#16A34A]/5'
                      : 'border-black/5 hover:border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      data.dailyStruggles.includes(struggle)
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-black/20'
                    }`}>
                      {data.dailyStruggles.includes(struggle) && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1">{struggle}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 7 - Work Style Diagnostic
  if (step === 7) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-10 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Help us understand your work style
            </h2>
            
            <div className="space-y-10">
              {/* Sliders */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Mental load</Label>
                    <span className="text-black/40">
                      {data.mentalLoad < 33 ? 'Low' : data.mentalLoad < 66 ? 'Moderate' : 'Overwhelming'}
                    </span>
                  </div>
                  <Slider
                    value={[data.mentalLoad]}
                    onValueChange={([value]) => updateData('mentalLoad', value)}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Focus quality</Label>
                    <span className="text-black/40">
                      {data.focusQuality < 33 ? 'Scattered' : data.focusQuality < 66 ? 'Moderate' : 'Deep'}
                    </span>
                  </div>
                  <Slider
                    value={[data.focusQuality]}
                    onValueChange={([value]) => updateData('focusQuality', value)}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>End-of-day satisfaction</Label>
                    <span className="text-black/40">
                      {data.satisfaction < 33 ? 'Never' : data.satisfaction < 66 ? 'Sometimes' : 'Often'}
                    </span>
                  </div>
                  <Slider
                    value={[data.satisfaction]}
                    onValueChange={([value]) => updateData('satisfaction', value)}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                </div>
              </div>

              {/* Binary questions */}
              <div className="space-y-4">
                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="mb-4">Do you overthink what to work on?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateData('overthinkTasks', true)}
                      className={`flex-1 py-3 rounded-2xl border transition-all ${
                        data.overthinkTasks === true
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => updateData('overthinkTasks', false)}
                      className={`flex-1 py-3 rounded-2xl border transition-all ${
                        data.overthinkTasks === false
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="mb-4">Do you feel you should always do more?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateData('shouldDoMore', true)}
                      className={`flex-1 py-3 rounded-2xl border transition-all ${
                        data.shouldDoMore === true
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => updateData('shouldDoMore', false)}
                      className={`flex-1 py-3 rounded-2xl border transition-all ${
                        data.shouldDoMore === false
                          ? 'border-[#16A34A] bg-[#16A34A]/5'
                          : 'border-black/5 hover:border-black/10'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              disabled={data.overthinkTasks === null || data.shouldDoMore === null}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 8 - Goals & Intent
  if (step === 8) {
    const goals = [
      'Work with clarity',
      'Feel in control',
      'Reduce stress',
      'Be more consistent',
      'Stop wasting mental energy',
    ];

    const horizons = ['Next 2 weeks', 'This semester', 'This year'];

    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              What do you want to change?
            </h2>
            
            <div className="space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleMultiple('wantToChange', goal)}
                  className={`w-full p-6 border rounded-3xl text-left transition-all ${
                    data.wantToChange.includes(goal)
                      ? 'border-[#16A34A] bg-[#16A34A]/5'
                      : 'border-black/5 hover:border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      data.wantToChange.includes(goal)
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-black/20'
                    }`}>
                      {data.wantToChange.includes(goal) && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="flex-1">{goal}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <Label>Time horizon</Label>
              <div className="space-y-3">
                {horizons.map((horizon) => (
                  <button
                    key={horizon}
                    onClick={() => updateData('timeHorizon', horizon)}
                    className={`w-full p-4 border rounded-3xl transition-all ${
                      data.timeHorizon === horizon
                        ? 'border-[#16A34A] bg-[#16A34A]/5'
                        : 'border-black/5 hover:border-black/10'
                    }`}
                  >
                    {horizon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              disabled={data.wantToChange.length === 0 || !data.timeHorizon}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 9 - WOW MOMENT (KEY SCREEN)
  if (step === 9) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full space-y-16">
          <div className="space-y-12 text-center">
            {/* Personalized diagnosis */}
            <div className="space-y-6">
              <h1 className="tracking-tight leading-tight" style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}>
                {data.firstName}, your effort is high.
              </h1>
              <h1 className="tracking-tight leading-tight" style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}>
                Your stress is high.
              </h1>
              <h1 className="tracking-tight leading-tight" style={{ letterSpacing: '-0.04em', fontSize: '1.75rem' }}>
                Your structure is unclear.
              </h1>
            </div>

            {/* The revelation */}
            <div className="space-y-6 pt-8">
              <div className="h-px bg-black/10 w-24 mx-auto" />
              
              <div className="space-y-4">
                <p className="text-black/80">You don't need to work more.</p>
                <p className="text-black/80">
                  You need a system that decides for you.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={nextStep}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Build my ideal day
            </Button>
            <Button 
              onClick={prevStep}
              variant="ghost"
              className="w-full rounded-3xl h-14 text-black/60"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 10 - Ideal Day Generation
  if (step === 10) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full space-y-12 text-center">
          <div className="space-y-6">
            <p className="text-black/60">
              We're building your ideal day based on your profile.
            </p>
            
            {/* Subtle progress indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse delay-75" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse delay-150" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 11 - Ideal Day Preview
  if (step === 11) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-16 bg-white">
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                Your ideal day
              </h2>
              <p className="text-black/60">
                This is what working with clarity feels like.
              </p>
            </div>
            
            {/* Main priority */}
            <div className="space-y-3">
              <p className="text-black/60">Main priority</p>
              <div className="p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl">
                <div className="space-y-2">
                  <h3>Complete today's readings</h3>
                  <p className="text-black/60">{data.fieldOfStudy}</p>
                  <div className="flex items-center gap-2 text-black/60 pt-2">
                    <span>~90 min</span>
                    <span>•</span>
                    <span>Deep focus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              <p className="text-black/60">Also scheduled</p>
              <div className="space-y-3">
                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="mb-1">Review lecture notes</p>
                  <p className="text-black/60">~30 min</p>
                </div>
                <div className="p-6 border border-black/5 rounded-3xl bg-white">
                  <p className="mb-1">Practice exercises</p>
                  <p className="text-black/60">~45 min</p>
                </div>
              </div>
            </div>

            {/* Habits */}
            <div className="space-y-3">
              <p className="text-black/60">Daily habits</p>
              <div className="space-y-3">
                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black/20" />
                  <span>Morning review</span>
                </div>
                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-black/20" />
                  <span>Evening reflection</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white py-6 space-y-3">
            <Button 
              onClick={nextStep}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Enter my dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 12 - Freemium Transition
  if (step === 12) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                You're now on the free plan.
              </h2>
            </div>
            
            {/* What's included */}
            <div className="space-y-4">
              <p className="text-black/60">What's included:</p>
              <div className="space-y-3">
                {['Daily structure', 'Focus sessions', 'Basic tracking'].map((feature, i) => (
                  <div
                    key={i}
                    className="p-6 border border-black/5 rounded-3xl bg-white flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-black/40">
              Upgrade anytime for full guidance.
            </p>
          </div>

          <Button 
            onClick={nextStep}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
          >
            Start my day
          </Button>
        </div>
      </div>
    );
  }

  return null;
}