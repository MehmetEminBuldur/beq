'use client';

import { Navigation } from '@/components/layout/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, Target, Calendar, Brain, Sparkles } from 'lucide-react';

const sections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of using BeQ for life management',
    items: [
      'Setting up your account',
      'Understanding Bricks and Quantas',
      'Your first goal setup',
      'Basic navigation guide'
    ]
  },
  {
    icon: Target,
    title: 'Bricks & Quantas System',
    description: 'Master our unique goal-breaking methodology',
    items: [
      'What are Bricks?',
      'Understanding Quantas',
      'Creating effective breakdowns',
      'Tracking progress efficiently'
    ]
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Make the most of AI-powered time management',
    items: [
      'Calendar integration setup',
      'AI scheduling preferences',
      'Optimizing your routine',
      'Managing conflicts'
    ]
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Get the most out of your AI companion',
    items: [
      'Chat interface basics',
      'Natural language commands',
      'Personalization settings',
      'Advanced AI features'
    ]
  }
];

const quickStart = [
  {
    step: '1',
    title: 'Create Your Account',
    description: 'Sign up with email or social auth'
  },
  {
    step: '2',
    title: 'Set Your First Goal',
    description: 'Define what you want to achieve'
  },
  {
    step: '3',
    title: 'Break It Down',
    description: 'Let AI help create actionable Bricks'
  },
  {
    step: '4',
    title: 'Schedule & Execute',
    description: 'Follow your personalized timeline'
  }
];

export default function DocsPage() {
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
              BeQ Documentation
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Everything you need to know about using BeQ for effective life management.
            </p>
          </motion.div>

          {/* Quick Start Guide */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="text-center mb-12">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Quick Start Guide</h2>
              <p className="text-muted-foreground mt-2">Get up and running in minutes</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickStart.map((item, index) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Documentation Sections */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-20 max-w-6xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground">Explore the Documentation</h2>
              <p className="text-muted-foreground mt-2">Dive deeper into BeQ's features and capabilities</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <section.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {section.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {section.description}
                      </p>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Additional Resources */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-20 max-w-4xl text-center"
          >
            <div className="rounded-lg border border-border bg-card p-8">
              <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Need More Help?
              </h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to help you make the most of BeQ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Contact Support
                </button>
                <button className="rounded-lg border border-border px-6 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors">
                  Community Forum
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}