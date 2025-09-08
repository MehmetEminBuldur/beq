'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="relative"
    >
      <dt className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
          {title}
        </div>
      </dt>
      <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
        <p className="flex-auto text-center">{description}</p>
      </dd>
    </motion.div>
  );
}
