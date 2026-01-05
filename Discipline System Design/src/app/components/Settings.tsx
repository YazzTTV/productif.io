import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { ArrowLeft, ChevronRight, Check, Bell, Clock, AlarmClock, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import productifLogo from 'figma:asset/74a73e97503d2c70426e85e4615331f23c885101.png';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../translations/appTranslations';

interface SettingsProps {
  onNavigate: (screen: string) => void;
}

type FocusDuration = 25 | 45 | 60 | 90;
type WorkloadIntensity = 'light' | 'balanced' | 'intensive';
type SettingsView = 'main' | 'editProfile' | 'dailyStructure' | 'notifications';

export function Settings({ onNavigate }: SettingsProps) {
  const [view, setView] = useState<SettingsView>('main');

  // Profile
  const [name, setName] = useState('Marie Dubois');
  const [academicField, setAcademicField] = useState('Medical School');
  const [studyLevel, setStudyLevel] = useState('Year 2');

  // Daily Structure
  const [focusDuration, setFocusDuration] = useState<FocusDuration>(45);
  const [maxSessions, setMaxSessions] = useState(6);
  const [workloadIntensity, setWorkloadIntensity] = useState<WorkloadIntensity>('balanced');

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [startOfDayReminder, setStartOfDayReminder] = useState(true);
  const [focusReminder, setFocusReminder] = useState(true);
  const [breakReminder, setBreakReminder] = useState(false);
  const [endOfDayRecap, setEndOfDayRecap] = useState(true);

  // Connection status
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const showSavedFeedback = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER VIEWS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (view === 'editProfile') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('main')}
              className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Edit Profile
            </h1>
          </div>
        </div>

        <div className="px-6 pt-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm text-black/60 px-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>

            {/* Academic Field */}
            <div className="space-y-2">
              <label className="text-sm text-black/60 px-1">Academic field</label>
              <input
                type="text"
                value={academicField}
                onChange={(e) => setAcademicField(e.target.value)}
                className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>

            {/* Study Level */}
            <div className="space-y-2">
              <label className="text-sm text-black/60 px-1">Study level</label>
              <input
                type="text"
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                className="w-full px-4 py-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-[#16A34A] transition-colors"
              />
            </div>

            {/* Save button */}
            <Button
              onClick={() => {
                showSavedFeedback();
                setTimeout(() => setView('main'), 500);
              }}
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
            >
              Save Changes
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (view === 'dailyStructure') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('main')}
                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Daily Structure
              </h1>
            </div>

            {/* Saved feedback */}
            <AnimatePresence>
              {savedFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#16A34A]/10 rounded-full"
                >
                  <Check className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-sm text-[#16A34A]">Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 pt-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-black/40 text-sm">These settings help the system adapt to you.</p>

            {/* Preferred focus duration */}
            <div className="p-6 border border-black/5 rounded-3xl bg-white space-y-4">
              <div>
                <p className="font-medium mb-1">Preferred focus duration</p>
                <p className="text-sm text-black/60">Default session length</p>
              </div>
              <div className="flex gap-3">
                {([25, 45, 60, 90] as const).map((duration) => (
                  <motion.button
                    key={duration}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFocusDuration(duration);
                      showSavedFeedback();
                    }}
                    className={`flex-1 py-3 rounded-2xl border transition-all ${
                      focusDuration === duration
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                        : 'border-black/5 hover:border-black/10'
                    }`}
                  >
                    {duration}m
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Max sessions per day */}
            <div className="p-6 border border-black/5 rounded-3xl bg-white space-y-4">
              <div>
                <p className="font-medium mb-1">Maximum focus sessions per day</p>
                <p className="text-sm text-black/60">Daily capacity limit</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={maxSessions}
                  onChange={(e) => {
                    setMaxSessions(Number(e.target.value));
                    showSavedFeedback();
                  }}
                  className="flex-1 h-2 bg-black/5 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#16A34A] [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="text-2xl font-medium w-8 text-center">{maxSessions}</span>
              </div>
            </div>

            {/* Workload intensity */}
            <div className="p-6 border border-black/5 rounded-3xl bg-white space-y-4">
              <div>
                <p className="font-medium mb-1">Daily workload intensity</p>
                <p className="text-sm text-black/60">Pace and session frequency</p>
              </div>
              <div className="flex gap-3">
                {(['light', 'balanced', 'intensive'] as const).map((intensity) => (
                  <motion.button
                    key={intensity}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setWorkloadIntensity(intensity);
                      showSavedFeedback();
                    }}
                    className={`flex-1 py-3 rounded-2xl border transition-all ${
                      workloadIntensity === intensity
                        ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                        : 'border-black/5 hover:border-black/10'
                    }`}
                  >
                    <span className="capitalize">{intensity}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (view === 'notifications') {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setView('main')}
                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
                Notifications
              </h1>
            </div>

            {/* Saved feedback */}
            <AnimatePresence>
              {savedFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#16A34A]/10 rounded-full"
                >
                  <Check className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-sm text-[#16A34A]">Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 pt-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Global toggle */}
            <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">Enable notifications</p>
                <p className="text-sm text-black/60">Receive reminders and updates</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked);
                  showSavedFeedback();
                }}
              />
            </div>

            {/* Sub-section: Rappels et horaires */}
            {notificationsEnabled && (
              <>
                <div className="pt-4">
                  <h3 className="text-black/40 uppercase tracking-wide text-sm mb-3">Rappels et horaires</h3>
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">Start of day reminder</p>
                    <p className="text-sm text-black/60">8:00 AM</p>
                  </div>
                  <Switch
                    checked={startOfDayReminder}
                    onCheckedChange={(checked) => {
                      setStartOfDayReminder(checked);
                      showSavedFeedback();
                    }}
                  />
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">Focus session reminder</p>
                    <p className="text-sm text-black/60">Before scheduled blocks</p>
                  </div>
                  <Switch
                    checked={focusReminder}
                    onCheckedChange={(checked) => {
                      setFocusReminder(checked);
                      showSavedFeedback();
                    }}
                  />
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">Break reminder</p>
                    <p className="text-sm text-black/60">When break starts</p>
                  </div>
                  <Switch
                    checked={breakReminder}
                    onCheckedChange={(checked) => {
                      setBreakReminder(checked);
                      showSavedFeedback();
                    }}
                  />
                </div>

                <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">End-of-day recap</p>
                    <p className="text-sm text-black/60">9:00 PM</p>
                  </div>
                  <Switch
                    checked={endOfDayRecap}
                    onCheckedChange={(checked) => {
                      setEndOfDayRecap(checked);
                      showSavedFeedback();
                    }}
                  />
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Settings
            </h1>
          </div>

          {/* Saved feedback */}
          <AnimatePresence>
            {savedFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#16A34A]/10 rounded-full"
              >
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span className="text-sm text-[#16A34A]">Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 pt-8 space-y-12">
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 1 — ACCOUNT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Account</h2>
          
          <div className="p-6 border border-black/5 rounded-3xl bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/40">Name</p>
                <p className="font-medium">{name}</p>
              </div>
            </div>
            <div className="h-px bg-black/5" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/40">Academic field</p>
                <p className="font-medium">{academicField}</p>
              </div>
            </div>
            <div className="h-px bg-black/5" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/40">Study level</p>
                <p className="font-medium">{studyLevel}</p>
              </div>
            </div>
            <div className="h-px bg-black/5" />
            <Button
              variant="ghost"
              className="w-full justify-between h-12 rounded-2xl hover:bg-black/5"
              onClick={() => setView('editProfile')}
            >
              <span>Edit profile</span>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </Button>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 2 — DAILY STRUCTURE (Button Style) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Daily Structure</h2>

          <button
            className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between group"
            onClick={() => setView('dailyStructure')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#16A34A]" />
              </div>
              <div className="text-left">
                <p className="font-medium mb-1">Daily Structure</p>
                <p className="text-sm text-black/60">
                  {focusDuration}min • {maxSessions} sessions • {workloadIntensity}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
          </button>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 4 — NOTIFICATIONS (Like image) */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Notifications</h2>

          <div className="space-y-3">
            {/* Main toggle with icon */}
            <div className="p-6 border border-black/5 rounded-3xl bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#16A34A]" />
                </div>
                <p className="font-medium">Notifications</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked);
                  showSavedFeedback();
                }}
              />
            </div>

            {/* Submenu button - Rappels et horaires */}
            {notificationsEnabled && (
              <button 
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between group"
                onClick={() => setView('notifications')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                    <AlarmClock className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium mb-1">Rappels et horaires</p>
                    <p className="text-sm text-black/60">
                      Matin, midi, soir, questions humeur/stress/focus
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
              </button>
            )}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 5 — PRIVACY & DATA */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Privacy & Data</h2>

          <div className="space-y-3">
            <div className="p-6 border border-black/5 rounded-3xl bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium mb-1">Google Calendar</p>
                  <p className="text-sm text-black/60">
                    {calendarConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  calendarConnected ? 'bg-[#16A34A]' : 'bg-black/20'
                }`} />
              </div>
              {calendarConnected && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCalendarConnected(false);
                    showSavedFeedback();
                  }}
                  className="w-full justify-center h-10 rounded-2xl hover:bg-black/5 text-black/60"
                >
                  Disconnect
                </Button>
              )}
            </div>

            <button className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium mb-1">Data usage summary</p>
                <p className="text-sm text-black/60">See what we collect</p>
              </div>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </button>

            <button className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium mb-1">Export my data</p>
                <p className="text-sm text-black/60">Download all your information</p>
              </div>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </button>

            <button className="w-full p-6 border border-black/10 rounded-3xl bg-white hover:bg-black/5 transition-all">
              <p className="font-medium text-black/60">Delete my account</p>
            </button>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 6 — SUBSCRIPTION */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Subscription</h2>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate('paywall')}
            className="w-full p-8 border-2 border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl hover:shadow-lg hover:shadow-[#16A34A]/10 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-lg mb-1">Current plan: Free</p>
                  <p className="text-sm text-black/60">
                    Unlock Exam Mode, calendar sync, and advanced AI
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-[#16A34A]" />
              </div>
            </div>
          </motion.button>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 7 — SUPPORT & INFO */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-black/40 uppercase tracking-wide text-sm">Support & Info</h2>

          <div className="space-y-3">
            <button className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between">
              <p className="font-medium">Help</p>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </button>

            <button className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between">
              <p className="font-medium">Contact support</p>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </button>

            <button className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all flex items-center justify-between">
              <p className="font-medium">Terms & privacy</p>
              <ChevronRight className="w-5 h-5 text-black/40" />
            </button>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SECTION 8 — LOGOUT */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <button
            onClick={() => onNavigate('onboarding')}
            className="w-full p-6 border-2 border-red-500/20 bg-red-50 rounded-3xl hover:bg-red-100 transition-all flex items-center justify-center gap-3 group"
          >
            <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors" />
            <p className="font-medium text-red-600 group-hover:text-red-700 transition-colors">Log out</p>
          </button>
        </motion.section>

        {/* Footer */}
        <div className="pt-8 pb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-2"
          >
            <img 
              src={productifLogo} 
              alt="Productif.io" 
              className="w-12 h-12 opacity-60"
            />
          </motion.div>
          <p className="text-black/40 italic">Productif.io — built for serious students.</p>
          <p className="text-black/20 text-sm">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}