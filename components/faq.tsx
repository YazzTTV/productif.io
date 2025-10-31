"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function Faq() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Frequently Asked Questions <span className="text-green-500">👋</span>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              How is Productif.io different from other productivity tools?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              Most tools force you to adapt to them. Productif.io does the opposite: it adapts to you, your rhythm, and your real priorities. And most importantly, our AI assistant comes to you via WhatsApp — no need to open yet another app. It guides you throughout your day with smart, context-aware reminders.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              How does the €1 waitlist offer work?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              By paying €1, you reserve your spot on our exclusive waitlist limited to 150 people. This small symbolic investment helps us filter for genuinely interested users. At the official launch, you’ll get priority access to our exceptional Lifetime offer at a preferential rate. This price will never change for you, even if we increase prices in the future.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              How does the WhatsApp assistant work?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              You receive personalized messages guiding you throughout your day. Task reminders at the right moment, habit check-ins, planning reorganization when things change… everything happens through a natural conversation. It’s like having a personal assistant in your pocket that understands your context and helps you stay focused on what truly matters.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              Is my data secure?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              Absolutely. Your data security is our priority. We use end-to-end encryption, automatic backups, and advanced security protocols to protect your information. Your data belongs to you and is never shared with third parties. Productif.io exists to help you take control of your life — not your data.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              What exactly do I get with this waitlist?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              By joining the waitlist for €1, you get: 1) Early access to Productif.io before the official launch, 2) The Lifetime offer at a preferential rate that won’t be repeated, 3) Personalized support to maximize the tool’s value, 4) Top priority for upcoming features, and 5) The certainty of being among the first to benefit from a technology that will transform your productivity.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
} 