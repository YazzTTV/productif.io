"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="Productif.io"
              width={40}
              height={40}
              className="object-contain"
            />
            <h1 className="text-2xl text-gray-900 whitespace-nowrap font-bold">
              Productif.io
            </h1>
          </Link>

          {/* Navigation Links (centered) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-medium">
            <Link
              href="/#features"
              className="text-gray-700 hover:text-[#00C27A] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="text-gray-700 hover:text-[#00C27A] transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="/#faq"
              className="text-gray-700 hover:text-[#00C27A] transition-colors"
            >
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:border-[#00C27A] hover:text-[#00C27A] transition-colors"
            >
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-sm text-white shadow-md hover:from-[#00B86A] hover:to-[#00C87F] transition-colors"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}