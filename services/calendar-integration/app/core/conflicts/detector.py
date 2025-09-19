"""
Conflict detection and resolution for calendar events.

This module provides comprehensive conflict detection logic for calendar events,
including time overlap detection, priority-based conflict resolution, and
suggestions for conflict resolution strategies.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class ConflictType(Enum):
    """Types of calendar conflicts."""
    TIME_OVERLAP = "time_overlap"
    DOUBLE_BOOKING = "double_booking"
    PRIORITY_CONFLICT = "priority_conflict"
    RESOURCE_CONFLICT = "resource_conflict"
    RECURRING_CONFLICT = "recurring_conflict"


class ConflictSeverity(Enum):
    """Severity levels for conflicts."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ResolutionStrategy(Enum):
    """Strategies for resolving conflicts."""
    KEEP_EXISTING = "keep_existing"
    REPLACE_WITH_NEW = "replace_with_new"
    MERGE_EVENTS = "merge_events"
    MOVE_TO_ALTERNATIVE_TIME = "move_to_alternative_time"
    SPLIT_EVENT = "split_event"
    CANCEL_EVENT = "cancel_event"
    USER_DECISION = "user_decision"


@dataclass
class Conflict:
    """Represents a calendar event conflict."""
    conflict_id: str
    conflict_type: ConflictType
    severity: ConflictSeverity
    description: str
    events: List[Dict[str, Any]]
    suggested_resolution: ResolutionStrategy
    resolution_options: List[ResolutionStrategy]
    metadata: Dict[str, Any]


@dataclass
class ConflictResolution:
    """Represents a conflict resolution decision."""
    conflict_id: str
    strategy: ResolutionStrategy
    resolved_events: List[Dict[str, Any]]
    discarded_events: List[Dict[str, Any]]
    notes: Optional[str] = None


class ConflictDetector:
    """Detects and resolves calendar event conflicts."""

    def __init__(self):
        self.conflicts: Dict[str, Conflict] = {}
        self.resolutions: Dict[str, ConflictResolution] = {}

    def detect_conflicts(
        self,
        events: List[Dict[str, Any]],
        time_window_start: Optional[datetime] = None,
        time_window_end: Optional[datetime] = None
    ) -> List[Conflict]:
        """
        Detect conflicts in a list of calendar events.

        Args:
            events: List of calendar events
            time_window_start: Start of time window to check (optional)
            time_window_end: End of time window to check (optional)

        Returns:
            List of detected conflicts
        """
        conflicts = []
        processed_events = []

        # Sort events by start time for efficient processing
        sorted_events = sorted(events, key=lambda x: self._parse_datetime(x.get("start_time", "")))

        for i, event in enumerate(sorted_events):
            event_conflicts = []

            # Check for time overlaps with previously processed events
            for processed_event in processed_events:
                if self._events_overlap(event, processed_event):
                    conflict = self._create_overlap_conflict([event, processed_event])
                    if conflict:
                        event_conflicts.append(conflict)

            # Check for conflicts with events in the same time window
            for j in range(i + 1, len(sorted_events)):
                other_event = sorted_events[j]

                # Only check events within reasonable time proximity
                if self._should_check_events(event, other_event, time_window_start, time_window_end):
                    if self._events_overlap(event, other_event):
                        conflict = self._create_overlap_conflict([event, other_event])
                        if conflict:
                            event_conflicts.append(conflict)

            # Check for priority-based conflicts
            priority_conflicts = self._detect_priority_conflicts(event, processed_events)
            event_conflicts.extend(priority_conflicts)

            # Check for recurring event conflicts
            recurring_conflicts = self._detect_recurring_conflicts(event, processed_events)
            event_conflicts.extend(recurring_conflicts)

            # Store conflicts
            for conflict in event_conflicts:
                self.conflicts[conflict.conflict_id] = conflict
                conflicts.append(conflict)

            processed_events.append(event)

        logger.info(
            "Conflict detection completed",
            total_events=len(events),
            conflicts_found=len(conflicts)
        )

        return conflicts

    def resolve_conflict(
        self,
        conflict_id: str,
        strategy: ResolutionStrategy,
        user_decision: Optional[Dict[str, Any]] = None
    ) -> ConflictResolution:
        """
        Resolve a conflict using the specified strategy.

        Args:
            conflict_id: ID of the conflict to resolve
            strategy: Resolution strategy to apply
            user_decision: Additional user-provided decision data

        Returns:
            Conflict resolution details
        """
        if conflict_id not in self.conflicts:
            raise ValueError(f"Conflict {conflict_id} not found")

        conflict = self.conflicts[conflict_id]
        resolution = self._apply_resolution_strategy(conflict, strategy, user_decision)

        self.resolutions[conflict_id] = resolution

        logger.info(
            "Conflict resolved",
            conflict_id=conflict_id,
            strategy=strategy.value,
            resolved_count=len(resolution.resolved_events),
            discarded_count=len(resolution.discarded_events)
        )

        return resolution

    def auto_resolve_conflicts(
        self,
        conflicts: List[Conflict],
        auto_resolution_rules: Optional[Dict[str, Any]] = None
    ) -> List[ConflictResolution]:
        """
        Automatically resolve conflicts using predefined rules.

        Args:
            conflicts: List of conflicts to resolve
            auto_resolution_rules: Rules for automatic resolution

        Returns:
            List of conflict resolutions
        """
        resolutions = []
        rules = auto_resolution_rules or self._get_default_auto_resolution_rules()

        for conflict in conflicts:
            strategy = self._determine_auto_resolution_strategy(conflict, rules)
            if strategy:
                resolution = self.resolve_conflict(conflict.conflict_id, strategy)
                resolutions.append(resolution)

        return resolutions

    def get_conflict_statistics(self) -> Dict[str, Any]:
        """Get statistics about detected conflicts."""
        total_conflicts = len(self.conflicts)
        resolved_conflicts = len(self.resolutions)

        conflict_types = {}
        severities = {}

        for conflict in self.conflicts.values():
            conflict_types[conflict.conflict_type.value] = conflict_types.get(conflict.conflict_type.value, 0) + 1
            severities[conflict.severity.value] = severities.get(conflict.severity.value, 0) + 1

        return {
            "total_conflicts": total_conflicts,
            "resolved_conflicts": resolved_conflicts,
            "unresolved_conflicts": total_conflicts - resolved_conflicts,
            "conflict_types": conflict_types,
            "severities": severities,
            "resolution_rate": resolved_conflicts / total_conflicts if total_conflicts > 0 else 0
        }

    def _events_overlap(self, event1: Dict[str, Any], event2: Dict[str, Any]) -> bool:
        """Check if two events overlap in time."""
        try:
            start1 = self._parse_datetime(event1.get("start_time", ""))
            end1 = self._parse_datetime(event1.get("end_time", ""))
            start2 = self._parse_datetime(event2.get("start_time", ""))
            end2 = self._parse_datetime(event2.get("end_time", ""))

            # Check for overlap: event1 starts before event2 ends AND event1 ends after event2 starts
            return start1 < end2 and end1 > start2

        except (ValueError, KeyError):
            return False

    def _should_check_events(
        self,
        event1: Dict[str, Any],
        event2: Dict[str, Any],
        window_start: Optional[datetime],
        window_end: Optional[datetime]
    ) -> bool:
        """Determine if two events should be checked for conflicts."""
        try:
            start1 = self._parse_datetime(event1.get("start_time", ""))
            start2 = self._parse_datetime(event2.get("start_time", ""))

            # Check if both events are within the specified time window
            if window_start and window_end:
                return (window_start <= start1 <= window_end and
                       window_start <= start2 <= window_end)

            # Check if events are within a reasonable time proximity (same day)
            return abs((start1 - start2).days) <= 1

        except (ValueError, KeyError):
            return False

    def _create_overlap_conflict(self, events: List[Dict[str, Any]]) -> Optional[Conflict]:
        """Create a conflict object for overlapping events."""
        if len(events) < 2:
            return None

        # Generate conflict ID
        event_ids = sorted([event.get("id", "") for event in events])
        conflict_id = f"overlap_{'_'.join(event_ids)}"

        # Determine conflict severity based on event priorities
        severity = self._calculate_overlap_severity(events)

        # Determine suggested resolution
        suggested_resolution = self._suggest_overlap_resolution(events)

        description = self._generate_overlap_description(events)

        return Conflict(
            conflict_id=conflict_id,
            conflict_type=ConflictType.TIME_OVERLAP,
            severity=severity,
            description=description,
            events=events,
            suggested_resolution=suggested_resolution,
            resolution_options=[
                ResolutionStrategy.KEEP_EXISTING,
                ResolutionStrategy.REPLACE_WITH_NEW,
                ResolutionStrategy.MOVE_TO_ALTERNATIVE_TIME,
                ResolutionStrategy.USER_DECISION
            ],
            metadata={
                "overlap_duration": self._calculate_overlap_duration(events),
                "event_count": len(events)
            }
        )

    def _detect_priority_conflicts(self, event: Dict[str, Any], existing_events: List[Dict[str, Any]]) -> List[Conflict]:
        """Detect conflicts based on event priorities."""
        conflicts = []
        event_priority = self._get_event_priority(event)

        for existing_event in existing_events:
            existing_priority = self._get_event_priority(existing_event)

            # High priority event conflicting with lower priority
            if (event_priority == "high" and existing_priority in ["low", "medium"] and
                self._events_overlap(event, existing_event)):

                conflict = self._create_priority_conflict([event, existing_event])
                if conflict:
                    conflicts.append(conflict)

        return conflicts

    def _detect_recurring_conflicts(self, event: Dict[str, Any], existing_events: List[Dict[str, Any]]) -> List[Conflict]:
        """Detect conflicts with recurring events."""
        conflicts = []

        if event.get("recurrence"):
            for existing_event in existing_events:
                if (existing_event.get("recurrence") and
                    self._events_overlap(event, existing_event)):

                    conflict = self._create_recurring_conflict([event, existing_event])
                    if conflict:
                        conflicts.append(conflict)

        return conflicts

    def _create_priority_conflict(self, events: List[Dict[str, Any]]) -> Optional[Conflict]:
        """Create a priority-based conflict."""
        conflict_id = f"priority_{'_'.join([event.get('id', '') for event in events])}"

        return Conflict(
            conflict_id=conflict_id,
            conflict_type=ConflictType.PRIORITY_CONFLICT,
            severity=ConflictSeverity.MEDIUM,
            description="High priority event conflicts with lower priority event",
            events=events,
            suggested_resolution=ResolutionStrategy.REPLACE_WITH_NEW,
            resolution_options=[
                ResolutionStrategy.REPLACE_WITH_NEW,
                ResolutionStrategy.KEEP_EXISTING,
                ResolutionStrategy.USER_DECISION
            ],
            metadata={"priority_difference": "high_vs_lower"}
        )

    def _create_recurring_conflict(self, events: List[Dict[str, Any]]) -> Optional[Conflict]:
        """Create a recurring event conflict."""
        conflict_id = f"recurring_{'_'.join([event.get('id', '') for event in events])}"

        return Conflict(
            conflict_id=conflict_id,
            conflict_type=ConflictType.RECURRING_CONFLICT,
            severity=ConflictSeverity.HIGH,
            description="Recurring events conflict with each other",
            events=events,
            suggested_resolution=ResolutionStrategy.USER_DECISION,
            resolution_options=[
                ResolutionStrategy.MOVE_TO_ALTERNATIVE_TIME,
                ResolutionStrategy.CANCEL_EVENT,
                ResolutionStrategy.USER_DECISION
            ],
            metadata={"recurring_events": True}
        )

    def _calculate_overlap_severity(self, events: List[Dict[str, Any]]) -> ConflictSeverity:
        """Calculate the severity of an overlap conflict."""
        # Check if any high-priority events are involved
        priorities = [self._get_event_priority(event) for event in events]

        if "urgent" in priorities:
            return ConflictSeverity.CRITICAL
        elif "high" in priorities:
            return ConflictSeverity.HIGH
        elif len(events) > 2:  # Multiple events overlapping
            return ConflictSeverity.MEDIUM

        return ConflictSeverity.LOW

    def _calculate_overlap_duration(self, events: List[Dict[str, Any]]) -> int:
        """Calculate the duration of overlap in minutes."""
        if len(events) < 2:
            return 0

        try:
            # Find the overlap period
            starts = [self._parse_datetime(event.get("start_time", "")) for event in events]
            ends = [self._parse_datetime(event.get("end_time", "")) for event in events]

            overlap_start = max(starts)
            overlap_end = min(ends)

            if overlap_start < overlap_end:
                return int((overlap_end - overlap_start).total_seconds() / 60)

        except (ValueError, KeyError):
            pass

        return 0

    def _suggest_overlap_resolution(self, events: List[Dict[str, Any]]) -> ResolutionStrategy:
        """Suggest a resolution strategy for overlapping events."""
        priorities = [self._get_event_priority(event) for event in events]

        # If there's a clear priority winner, suggest replacing
        if "urgent" in priorities or "high" in priorities:
            return ResolutionStrategy.REPLACE_WITH_NEW

        # For multiple events, suggest user decision
        if len(events) > 2:
            return ResolutionStrategy.USER_DECISION

        # Default to keeping existing event
        return ResolutionStrategy.KEEP_EXISTING

    def _generate_overlap_description(self, events: List[Dict[str, Any]]) -> str:
        """Generate a human-readable description of the overlap conflict."""
        event_titles = [event.get("title", "Unknown Event") for event in events]
        overlap_minutes = self._calculate_overlap_duration(events)

        if len(events) == 2:
            return f"'{event_titles[0]}' overlaps with '{event_titles[1]}' for {overlap_minutes} minutes"
        else:
            return f"{len(events)} events overlap including '{event_titles[0]}' for {overlap_minutes} minutes"

    def _get_event_priority(self, event: Dict[str, Any]) -> str:
        """Extract priority from event data."""
        return event.get("priority", "medium").lower()

    def _parse_datetime(self, datetime_str: str) -> datetime:
        """Parse datetime string to datetime object."""
        if isinstance(datetime_str, str):
            # Handle different datetime formats
            try:
                return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            except ValueError:
                pass
        raise ValueError(f"Invalid datetime format: {datetime_str}")

    def _apply_resolution_strategy(
        self,
        conflict: Conflict,
        strategy: ResolutionStrategy,
        user_decision: Optional[Dict[str, Any]] = None
    ) -> ConflictResolution:
        """Apply the specified resolution strategy to a conflict."""

        resolved_events = []
        discarded_events = []

        if strategy == ResolutionStrategy.KEEP_EXISTING:
            # Keep the first (existing) event, discard others
            resolved_events = [conflict.events[0]]
            discarded_events = conflict.events[1:]

        elif strategy == ResolutionStrategy.REPLACE_WITH_NEW:
            # Keep the last (newest) event, discard others
            resolved_events = [conflict.events[-1]]
            discarded_events = conflict.events[:-1]

        elif strategy == ResolutionStrategy.MERGE_EVENTS:
            # Merge events (simplified implementation)
            merged_event = self._merge_events(conflict.events)
            resolved_events = [merged_event]
            discarded_events = []  # Original events are merged, not discarded

        elif strategy == ResolutionStrategy.USER_DECISION:
            # Apply user-provided decision
            if user_decision:
                resolved_events = user_decision.get("keep_events", [])
                discarded_events = user_decision.get("discard_events", [])
            else:
                # Default to keeping all if no decision provided
                resolved_events = conflict.events

        else:
            # Default: keep all events (no resolution)
            resolved_events = conflict.events

        return ConflictResolution(
            conflict_id=conflict.conflict_id,
            strategy=strategy,
            resolved_events=resolved_events,
            discarded_events=discarded_events,
            notes=user_decision.get("notes") if user_decision else None
        )

    def _merge_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge multiple events into one (simplified implementation)."""
        if not events:
            return {}

        # Use the first event as base
        merged = events[0].copy()

        # Combine titles
        titles = [event.get("title", "") for event in events]
        merged["title"] = " | ".join(titles)

        # Extend duration to cover all events
        starts = [self._parse_datetime(event.get("start_time", "")) for event in events]
        ends = [self._parse_datetime(event.get("end_time", "")) for event in events]

        merged["start_time"] = min(starts).isoformat()
        merged["end_time"] = max(ends).isoformat()

        # Combine descriptions
        descriptions = [event.get("description", "") for event in events if event.get("description")]
        if descriptions:
            merged["description"] = " | ".join(descriptions)

        return merged

    def _determine_auto_resolution_strategy(self, conflict: Conflict, rules: Dict[str, Any]) -> Optional[ResolutionStrategy]:
        """Determine automatic resolution strategy based on rules."""
        # Simple rule-based resolution
        if conflict.severity == ConflictSeverity.LOW:
            return ResolutionStrategy.KEEP_EXISTING
        elif conflict.severity == ConflictSeverity.CRITICAL:
            return ResolutionStrategy.USER_DECISION

        # Check conflict type specific rules
        type_rules = rules.get("conflict_types", {}).get(conflict.conflict_type.value, {})
        if type_rules.get("auto_resolve"):
            return type_rules.get("default_strategy", ResolutionStrategy.KEEP_EXISTING)

        return None

    def _get_default_auto_resolution_rules(self) -> Dict[str, Any]:
        """Get default rules for automatic conflict resolution."""
        return {
            "max_auto_resolve_severity": "medium",
            "conflict_types": {
                "time_overlap": {
                    "auto_resolve": True,
                    "default_strategy": "keep_existing"
                },
                "priority_conflict": {
                    "auto_resolve": True,
                    "default_strategy": "replace_with_new"
                },
                "recurring_conflict": {
                    "auto_resolve": False  # Requires user decision
                }
            }
        }
