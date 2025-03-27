import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const TRIAL_PERIOD_DAYS = 7
export const SUBSCRIPTION_PRICE = 15000 // 150 EUR en centimes 