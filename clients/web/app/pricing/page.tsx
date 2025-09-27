'use client';

import { Navigation } from '@/components/layout/navigation';
import { motion } from 'framer-motion';
import { Check, DollarSign, Star, Crown } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 dark:from-slate-900 dark:via-gray-900 dark:to-stone-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-300 to-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-300 to-slate-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-gray-300 to-zinc-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Navigation />

      <div className="py-24 sm:py-32 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-2xl">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-700 via-gray-800 to-stone-700 bg-clip-text text-transparent sm:text-5xl">
              Choose Your BeQ Plan
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Start your journey toward better life management with our flexible pricing options.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3"
          >
            {plans.map((plan, index) => {
              const getIcon = () => {
                if (plan.name === 'Free') return Star;
                if (plan.name === 'Pro') return Crown;
                return DollarSign;
              };
              const Icon = getIcon();
              
              const getGradient = () => {
                if (plan.name === 'Free') return 'from-blue-500 to-indigo-600';
                if (plan.name === 'Pro') return 'from-purple-500 to-indigo-600';
                return 'from-emerald-500 to-teal-600';
              };

              return (
                <div
                  key={plan.name}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} rounded-3xl blur-2xl opacity-${plan.popular ? '15' : '5'} group-hover:opacity-20 transition-opacity duration-500`}></div>
                  <div className={`relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 ${
                    plan.popular ? 'ring-2 ring-purple-500/50 bg-white/40 dark:bg-gray-800/40' : ''
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                          <Crown className="h-4 w-4 mr-1" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getGradient()} rounded-2xl mb-4 shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
                          /month
                        </span>
                      </p>
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                        {plan.description}
                      </p>
                    </div>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`p-1 bg-gradient-to-br ${getGradient()} rounded-full mt-0.5 flex-shrink-0`}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <button
                        className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                          plan.popular
                            ? `bg-gradient-to-r ${getGradient()} text-white hover:from-purple-600 hover:to-indigo-700`
                            : 'bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 text-gray-800 dark:text-white hover:bg-white/60 dark:hover:bg-gray-800/60'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}