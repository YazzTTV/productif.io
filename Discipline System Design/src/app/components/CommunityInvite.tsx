import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Users, GraduationCap, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CommunityInviteProps {
  onNavigate: (screen: string) => void;
  userName: string;
  userStats: {
    streak: number;
    xp: number;
    focusSessions: number;
  };
}

type InviteType = 'friend' | 'class' | 'link' | null;

export function CommunityInvite({ onNavigate, userName, userStats }: CommunityInviteProps) {
  const [step, setStep] = useState<'type' | 'message' | 'share'>('type');
  const [inviteType, setInviteType] = useState<InviteType>(null);
  const [personalMessage, setPersonalMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLink] = useState(`https://productif.io/invite/${userName.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`);

  const handleSelectType = (type: InviteType) => {
    setInviteType(type);
    setStep('message');
  };

  const handleContinue = () => {
    setStep('share');
  };

  const handleCopyLink = async () => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback: select text in input field
      const inputElement = document.getElementById('invite-link-input') as HTMLInputElement;
      if (inputElement) {
        inputElement.select();
        inputElement.setSelectionRange(0, 99999); // For mobile devices
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Copy failed:', fallbackErr);
        }
      }
    }
  };

  const handleShare = (platform: string) => {
    const message = personalMessage || 'Join me on Productif.io — a discipline system for serious students.';
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + '\n\n' + inviteLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`,
      messages: `sms:?body=${encodeURIComponent(message + '\n\n' + inviteLink)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-black/5 px-6 pt-12 pb-6 z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (step === 'message') {
                setStep('type');
              } else if (step === 'share') {
                setStep('message');
              } else {
                onNavigate('leaderboard');
              }
            }}
            className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className="tracking-tight" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
              Invite
            </h1>
            <p className="text-black/60 mt-1">
              {step === 'type' && 'Choose who to invite'}
              {step === 'message' && 'Make it personal'}
              {step === 'share' && 'Send your invitation'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose Invite Type */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <p className="text-black/40 mb-6">
                Inviting someone to Productif.io is inviting them into a system.
              </p>

              {/* Friend Invite */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectType('friend')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Friend Invite</h3>
                    <p className="text-sm text-black/60">
                      One-to-one accountability. Shared progress view.
                    </p>
                    <p className="text-sm text-black/40 mt-2 italic">
                      "Study with someone who takes discipline seriously."
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Class / Study Group */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectType('class')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-[#16A34A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Class / Study Group</h3>
                    <p className="text-sm text-black/60">
                      Small groups (5–30 max). Private by invite code.
                    </p>
                    <p className="text-sm text-black/40 mt-2 italic">
                      "Turn your class into a focused group."
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Open Link */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectType('link')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Open Link</h3>
                    <p className="text-sm text-black/60">
                      Shareable invite link. Requires acceptance.
                    </p>
                    <p className="text-sm text-black/40 mt-2">
                      Limited to prevent spam.
                    </p>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Personal Message */}
          {step === 'message' && (
            <motion.div
              key="message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="p-6 border border-black/5 rounded-3xl bg-white">
                <p className="text-black/60 mb-4">
                  {inviteType === 'friend' && 'Why are you inviting them?'}
                  {inviteType === 'class' && 'What brings this group together?'}
                  {inviteType === 'link' && 'Add a personal note (optional)'}
                </p>

                <Input
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder={
                    inviteType === 'friend'
                      ? 'We both need structure.'
                      : inviteType === 'class'
                      ? 'Same exams, same pressure.'
                      : "Let's stay consistent together."
                  }
                  className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:border-[#16A34A]/30 focus:ring-2 focus:ring-[#16A34A]/10 transition-all"
                />

                <p className="text-sm text-black/40 mt-3">
                  This makes the invitation feel intentional, not automated.
                </p>
              </div>

              {/* Preview */}
              <div className="p-6 border border-[#16A34A]/20 bg-[#16A34A]/5 rounded-3xl">
                <p className="text-black/40 mb-3 text-sm">Preview</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center font-medium text-[#16A34A]">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm text-black/60">{userStats.streak}d streak</p>
                    </div>
                  </div>
                  {personalMessage && (
                    <p className="text-black/80 italic">"{personalMessage}"</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-3xl h-14"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 3: Share Options */}
          {step === 'share' && (
            <motion.div
              key="share"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <p className="text-black/60">Choose how to share</p>

              {/* Link Display (for manual copy fallback) */}
              <div className="p-4 border border-black/5 rounded-2xl bg-black/5">
                <p className="text-xs text-black/40 mb-2">Your invite link</p>
                <input
                  id="invite-link-input"
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-full bg-transparent text-sm text-black/80 outline-none cursor-text"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>

              {/* Copy Link */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCopyLink}
                className={`w-full p-6 border rounded-3xl transition-all ${
                  copied
                    ? 'border-[#16A34A]/20 bg-[#16A34A]/5'
                    : 'border-black/5 bg-white hover:bg-black/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      copied ? 'bg-[#16A34A]/10' : 'bg-black/5'
                    }`}>
                      {copied ? (
                        <Check className="w-6 h-6 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-6 h-6 text-black/60" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{copied ? 'Link copied!' : 'Copy Link'}</p>
                      <p className="text-sm text-black/60">
                        {copied ? 'Share anywhere you want' : 'Share via any app'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* WhatsApp */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleShare('whatsapp')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-black/60">Send directly to a contact</p>
                  </div>
                </div>
              </motion.button>

              {/* Telegram */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleShare('telegram')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.23.171.324.016.094.037.308.021.475z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Telegram</p>
                    <p className="text-sm text-black/60">Share via Telegram</p>
                  </div>
                </div>
              </motion.button>

              {/* Messages */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleShare('messages')}
                className="w-full p-6 border border-black/5 rounded-3xl bg-white hover:bg-black/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Messages</p>
                    <p className="text-sm text-black/60">Send via SMS</p>
                  </div>
                </div>
              </motion.button>

              {/* Note */}
              <div className="p-4 bg-black/5 rounded-2xl">
                <p className="text-sm text-black/60 text-center">
                  No public sharing. Invitations are private and intentional.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}