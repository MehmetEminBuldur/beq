'use client';

import { Navigation } from '@/components/layout/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started with BeQ',
    features: [
      'Basic task management',
      'Simple calendar integration',
      'Up to 3 Bricks per month',
      'Basic AI suggestions',
      'Mobile and web access'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: '$9.99',
    description: 'For individuals who want to maximize their productivity',
    features: [
      'Unlimited Bricks and Quantas',
      'Advanced AI-powered scheduling',
      'Smart goal tracking',
      'Calendar integrations',
      'Priority support',
      'Advanced analytics',
      'Custom workflows'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Team',
    price: '$19.99',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team collaboration tools',
      'Shared Bricks and goals',
      'Team analytics',
      'Admin dashboard',
      'Custom integrations',
      'Dedicated support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Choose Your BeQ Plan
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Start your journey toward better life management with our flexible pricing options.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 shadow-lg ring-1 ${
                  plan.popular
                    ? 'ring-primary bg-primary/5'
                    : 'ring-border bg-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}