/**
 * Schedule Page - Demo of Schedule Optimization Features
 */

'use client';

import React from 'react';
import { ScheduleOptimizer } from '@/components/schedule/schedule-optimizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Brain, Clock } from 'lucide-react';

export default function SchedulePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI-Powered Schedule Optimization</h1>
        <p className="text-muted-foreground text-lg">
          Generate and optimize your daily schedule using advanced AI algorithms that understand
          your preferences, energy patterns, and constraints.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">AI-Powered</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Uses Gemma 3 27B IT model for intelligent scheduling decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Smart Timing</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Optimizes based on your energy peaks and work preferences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Fast Optimization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quick schedule generation with detailed reasoning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Flexible Planning</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              7-day planning horizon with customizable constraints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Optimizer Component */}
      <ScheduleOptimizer
        onScheduleGenerated={(events) => {
          console.log('Schedule generated:', events);
        }}
        onOptimizationComplete={(events) => {
          console.log('Schedule optimized:', events);
        }}
      />

      {/* Technical Details */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              How the schedule optimization system works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Backend Architecture</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• FastAPI orchestrator service</li>
                  <li>• AI scheduler service with Gemma 3 27B IT</li>
                  <li>• OpenRouter integration for LLM access</li>
                  <li>• Comprehensive data validation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">AI Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Natural language reasoning</li>
                  <li>• Context-aware planning</li>
                  <li>• Constraint satisfaction</li>
                  <li>• User preference learning</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Data Models</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">TaskInput</Badge>
                <Badge variant="outline">EventInput</Badge>
                <Badge variant="outline">UserPreferences</Badge>
                <Badge variant="outline">ConstraintInput</Badge>
                <Badge variant="outline">ScheduleResponse</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
