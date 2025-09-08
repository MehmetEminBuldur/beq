"""
Simple Scheduling Algorithms for BeQ.

This module provides lightweight scheduling algorithms that don't require
heavy constraint programming libraries like OR-Tools.
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from dateutil import tz
import pytz

@dataclass
class TimeSlot:
    """Represents a time slot in the schedule."""
    start: datetime
    end: datetime
    is_available: bool = True
    event_id: Optional[str] = None
    event_title: Optional[str] = None

@dataclass
class Task:
    """Represents a task to be scheduled."""
    id: str
    title: str
    duration_minutes: int
    priority: int  # 1 (highest) to 10 (lowest)
    deadline: Optional[datetime] = None
    preferred_time: Optional[time] = None
    category: str = "general"
    dependencies: List[str] = None

@dataclass
class UserPreferences:
    """User scheduling preferences."""
    work_start: time = time(9, 0)
    work_end: time = time(17, 0)
    break_duration: int = 15  # minutes
    break_frequency: int = 90  # minutes
    lunch_time: time = time(12, 0)
    lunch_duration: int = 60  # minutes
    timezone: str = "UTC"
    preferred_task_duration: int = 90  # minutes

class SimpleScheduler:
    """
    A simple, efficient scheduler that uses heuristic algorithms
    instead of complex constraint programming.
    """
    
    def __init__(self, user_preferences: UserPreferences):
        self.preferences = user_preferences
        self.timezone = pytz.timezone(user_preferences.timezone)
    
    def generate_available_slots(
        self, 
        start_date: datetime, 
        end_date: datetime,
        existing_events: List[TimeSlot] = None
    ) -> List[TimeSlot]:
        """Generate available time slots for the given date range."""
        
        if existing_events is None:
            existing_events = []
        
        available_slots = []
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        while current_date <= end_date:
            # Generate work hours for this day
            work_start = current_date.replace(
                hour=self.preferences.work_start.hour,
                minute=self.preferences.work_start.minute
            )
            work_end = current_date.replace(
                hour=self.preferences.work_end.hour,
                minute=self.preferences.work_end.minute
            )
            
            # Skip weekends (optional)
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                current_date += timedelta(days=1)
                continue
            
            # Create base work slot
            work_slot = TimeSlot(work_start, work_end, True)
            
            # Remove existing events from available time
            available_periods = self._subtract_existing_events([work_slot], existing_events)
            
            # Add breaks and lunch
            available_periods = self._add_breaks_and_lunch(available_periods, current_date)
            
            available_slots.extend(available_periods)
            current_date += timedelta(days=1)
        
        return available_slots
    
    def schedule_tasks(
        self,
        tasks: List[Task],
        available_slots: List[TimeSlot]
    ) -> Tuple[List[TimeSlot], List[Task]]:
        """
        Schedule tasks using a priority-based greedy algorithm.
        Returns: (scheduled_slots, unscheduled_tasks)
        """
        
        # Sort tasks by priority and deadline
        sorted_tasks = sorted(
            tasks,
            key=lambda t: (
                t.priority,
                t.deadline.timestamp() if t.deadline else float('inf'),
                -t.duration_minutes  # Prefer longer tasks first
            )
        )
        
        scheduled_slots = []
        unscheduled_tasks = []
        
        for task in sorted_tasks:
            best_slot = self._find_best_slot_for_task(task, available_slots)
            
            if best_slot:
                # Schedule the task
                task_slot = TimeSlot(
                    start=best_slot.start,
                    end=best_slot.start + timedelta(minutes=task.duration_minutes),
                    is_available=False,
                    event_id=task.id,
                    event_title=task.title
                )
                
                scheduled_slots.append(task_slot)
                
                # Update available slots
                available_slots = self._remove_scheduled_time(available_slots, task_slot)
            else:
                unscheduled_tasks.append(task)
        
        return scheduled_slots, unscheduled_tasks
    
    def optimize_schedule(
        self,
        scheduled_slots: List[TimeSlot],
        preferences: UserPreferences = None
    ) -> List[TimeSlot]:
        """
        Apply simple optimization heuristics to improve the schedule.
        """
        
        if preferences is None:
            preferences = self.preferences
        
        # Sort by start time
        sorted_slots = sorted(scheduled_slots, key=lambda s: s.start)
        
        # Apply optimization rules
        optimized_slots = []
        
        for slot in sorted_slots:
            # Rule 1: Batch similar tasks together
            # Rule 2: Minimize context switching
            # Rule 3: Respect energy levels (hard tasks in morning)
            
            optimized_slot = self._apply_optimization_rules(slot, optimized_slots)
            optimized_slots.append(optimized_slot)
        
        return optimized_slots
    
    def _subtract_existing_events(
        self, 
        available_slots: List[TimeSlot], 
        existing_events: List[TimeSlot]
    ) -> List[TimeSlot]:
        """Remove existing events from available time slots."""
        
        result = []
        
        for slot in available_slots:
            current_start = slot.start
            slot_end = slot.end
            
            # Check for overlaps with existing events
            for event in existing_events:
                if event.start >= slot_end or event.end <= current_start:
                    continue  # No overlap
                
                # Add time before the event (if any)
                if current_start < event.start:
                    result.append(TimeSlot(current_start, event.start, True))
                
                # Update current start to after the event
                current_start = max(current_start, event.end)
            
            # Add remaining time after all events
            if current_start < slot_end:
                result.append(TimeSlot(current_start, slot_end, True))
        
        return result
    
    def _add_breaks_and_lunch(
        self, 
        available_slots: List[TimeSlot], 
        date: datetime
    ) -> List[TimeSlot]:
        """Add breaks and lunch to the schedule."""
        
        result = []
        
        for slot in available_slots:
            current_time = slot.start
            slot_end = slot.end
            
            while current_time < slot_end:
                # Calculate work period until next break
                next_break = current_time + timedelta(minutes=self.preferences.break_frequency)
                work_end = min(next_break, slot_end)
                
                # Check if lunch time falls in this period
                lunch_time = date.replace(
                    hour=self.preferences.lunch_time.hour,
                    minute=self.preferences.lunch_time.minute
                )
                
                if current_time <= lunch_time <= work_end:
                    # Add work time before lunch
                    if current_time < lunch_time:
                        result.append(TimeSlot(current_time, lunch_time, True))
                    
                    # Skip lunch time
                    current_time = lunch_time + timedelta(minutes=self.preferences.lunch_duration)
                else:
                    # Add regular work period
                    result.append(TimeSlot(current_time, work_end, True))
                    
                    # Add break if not at end of slot
                    if work_end < slot_end:
                        current_time = work_end + timedelta(minutes=self.preferences.break_duration)
                    else:
                        current_time = work_end
        
        return result
    
    def _find_best_slot_for_task(
        self, 
        task: Task, 
        available_slots: List[TimeSlot]
    ) -> Optional[TimeSlot]:
        """Find the best available slot for a given task."""
        
        suitable_slots = []
        
        for slot in available_slots:
            slot_duration = (slot.end - slot.start).total_seconds() / 60
            
            # Check if slot is large enough
            if slot_duration >= task.duration_minutes:
                # Calculate fitness score
                score = self._calculate_slot_fitness(task, slot)
                suitable_slots.append((slot, score))
        
        if not suitable_slots:
            return None
        
        # Return slot with highest fitness score
        best_slot, _ = max(suitable_slots, key=lambda x: x[1])
        return best_slot
    
    def _calculate_slot_fitness(self, task: Task, slot: TimeSlot) -> float:
        """Calculate how well a slot fits a task (higher is better)."""
        
        score = 0.0
        
        # Deadline pressure (higher priority if deadline is near)
        if task.deadline:
            time_until_deadline = (task.deadline - slot.start).total_seconds() / 3600  # hours
            if time_until_deadline > 0:
                score += 100 / (1 + time_until_deadline / 24)  # Exponential decay
        
        # Preferred time matching
        if task.preferred_time:
            preferred_hour = task.preferred_time.hour
            slot_hour = slot.start.hour
            hour_diff = abs(preferred_hour - slot_hour)
            score += 50 / (1 + hour_diff)
        
        # Priority weight
        score += (11 - task.priority) * 10  # Higher priority = higher score
        
        # Time of day preference (morning for important tasks)
        if task.priority <= 3 and slot.start.hour < 12:
            score += 20
        
        # Avoid fragmentation (prefer larger slots)
        slot_duration = (slot.end - slot.start).total_seconds() / 60
        if slot_duration > task.duration_minutes * 1.5:
            score += 10
        
        return score
    
    def _remove_scheduled_time(
        self, 
        available_slots: List[TimeSlot], 
        scheduled_slot: TimeSlot
    ) -> List[TimeSlot]:
        """Remove scheduled time from available slots."""
        
        result = []
        
        for slot in available_slots:
            # No overlap
            if scheduled_slot.end <= slot.start or scheduled_slot.start >= slot.end:
                result.append(slot)
                continue
            
            # Add time before scheduled slot
            if slot.start < scheduled_slot.start:
                result.append(TimeSlot(slot.start, scheduled_slot.start, True))
            
            # Add time after scheduled slot
            if slot.end > scheduled_slot.end:
                result.append(TimeSlot(scheduled_slot.end, slot.end, True))
        
        return result
    
    def _apply_optimization_rules(
        self, 
        slot: TimeSlot, 
        previous_slots: List[TimeSlot]
    ) -> TimeSlot:
        """Apply optimization rules to improve scheduling."""
        
        # For now, return the slot as-is
        # Future enhancements can add:
        # - Task batching
        # - Context switching minimization
        # - Energy level optimization
        
        return slot

# Example usage and testing
def create_sample_schedule():
    """Create a sample schedule for testing."""
    
    preferences = UserPreferences(
        work_start=time(9, 0),
        work_end=time(17, 0),
        timezone="UTC"
    )
    
    scheduler = SimpleScheduler(preferences)
    
    # Create sample tasks
    tasks = [
        Task("1", "Important Meeting", 60, 1, datetime.now() + timedelta(days=1)),
        Task("2", "Code Review", 90, 2),
        Task("3", "Documentation", 120, 4),
        Task("4", "Email Processing", 30, 6),
        Task("5", "Learning Session", 45, 5),
    ]
    
    # Generate available slots for next 3 days
    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=3)
    
    available_slots = scheduler.generate_available_slots(start_date, end_date)
    scheduled_slots, unscheduled = scheduler.schedule_tasks(tasks, available_slots)
    
    return scheduled_slots, unscheduled

if __name__ == "__main__":
    scheduled, unscheduled = create_sample_schedule()
    print(f"Scheduled {len(scheduled)} tasks, {len(unscheduled)} remain unscheduled")
    
    for slot in scheduled[:5]:  # Show first 5
        print(f"Task: {slot.event_title} | {slot.start} - {slot.end}")
