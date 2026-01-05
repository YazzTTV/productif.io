import { Button } from './ui/button';
import { X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface PaywallProps {
  onNavigate: (screen: string) => void;
}

export function Paywall({ onNavigate }: PaywallProps) {
  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    // Mock upgrade - in production this would integrate with payment
    console.log(`Upgrading to ${plan} plan`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative">
      {/* Close button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="absolute top-6 right-6 w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
      >
        <X className="w-5 h-5 text-black/60" />
      </button>

      {/* Main content */}
      <div className="max-w-md w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-medium mb-2">
            Upgrade to Premium
          </h1>
          <p className="text-sm text-black/40">
            Unlock the full Productif.io experience
          </p>
        </motion.div>

        {/* Premium Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <div className="space-y-3">
            {[
              'Unlimited Focus sessions',
              'Exam Mode',
              'Plan My Day with AI',
              'Smart task prioritization',
              'Full habit tracking',
              'Progress & analytics',
              'Calendar sync',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                <span className="text-black/80">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3 mb-6"
        >
          {/* YEARLY PLAN - PRIMARY */}
          <Button
            onClick={() => handleUpgrade('yearly')}
            className="w-full bg-[#16a34a] hover:bg-[#16a34a]/90 text-white rounded-2xl h-auto py-4 flex flex-col items-center gap-1"
          >
            <div className="text-lg font-medium">€3.33 / month</div>
            <div className="text-sm opacity-90">
              Billed €39.97 per year (–60%)
            </div>
          </Button>

          {/* MONTHLY PLAN - SECONDARY */}
          <Button
            onClick={() => handleUpgrade('monthly')}
            variant="outline"
            className="w-full border-black/20 hover:bg-black/5 rounded-2xl h-14"
          >
            €7.99 / month
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <p className="text-xs text-black/40">
            Cancel anytime
          </p>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-sm text-black/40 hover:text-black/60 transition-colors"
          >
            Continue with free version
          </button>
        </motion.div>
      </div>
    </div>
  );
}
