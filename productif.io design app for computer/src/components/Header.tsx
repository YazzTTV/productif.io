import { motion } from "motion/react";

export function Header() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-20"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mr-auto">
            <img
              src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
              alt="Productif.io"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl text-gray-900 whitespace-nowrap font-bold">
              Productif.io
            </h1>
          </div>

          {/* Navigation Links (visuels uniquement dans l'app design) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button className="text-gray-700 hover:text-[#00C27A] transition-colors">
              Fonctionnalités
            </button>
            <button className="text-gray-700 hover:text-[#00C27A] transition-colors">
              Tarifs
            </button>
            <button className="text-gray-700 hover:text-[#00C27A] transition-colors">
              Témoignages
            </button>
            <button className="text-gray-700 hover:text-[#00C27A] transition-colors">
              FAQ
            </button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:border-[#00C27A] hover:text-[#00C27A] transition-colors">
              Se connecter
            </button>
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-sm text-white shadow-md hover:from-[#00B86A] hover:to-[#00C87F] transition-colors">
              Devenir beta testeur
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}


