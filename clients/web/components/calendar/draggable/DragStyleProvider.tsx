/**
 * DragStyleProvider Component
 * 
 * Provides drag-related CSS styles to the application
 */

'use client';

import { useEffect } from 'react';

export function DragStyleProvider() {
  useEffect(() => {
    // Inject drag styles if not already present
    if (!document.querySelector('#drag-system-styles')) {
      const style = document.createElement('style');
      style.id = 'drag-system-styles';
      
      // Import the CSS content (in a real app, this would be handled by the build system)
      style.textContent = `
        /* Global drag states */
        .dragging-in-progress {
          cursor: grabbing !important;
          user-select: none;
        }

        .dragging-in-progress * {
          cursor: grabbing !important;
        }

        /* Draggable objects */
        .draggable-schedule-object {
          position: relative;
          transition: all 0.2s ease;
          touch-action: none;
        }

        .draggable-schedule-object:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .draggable-schedule-object:active {
          transform: scale(0.98);
        }

        .draggable-schedule-object.dragging {
          z-index: 1000;
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          transition: none;
        }

        /* Ghost element */
        .dragging-ghost {
          pointer-events: none !important;
          z-index: 9999 !important;
          opacity: 0.8 !important;
          transform: scale(1.05) !important;
          transition: none !important;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3)) !important;
          border: 2px dashed rgba(59, 130, 246, 0.5) !important;
        }

        .dragging-ghost * {
          pointer-events: none !important;
        }

        /* Drop targets */
        [data-drop-target] {
          position: relative;
          transition: all 0.2s ease;
        }

        .drop-target-highlight {
          position: relative;
          z-index: 10;
        }

        .drop-target-highlight::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid;
          border-radius: 4px;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .drop-target-valid::before {
          border-color: #10b981;
          background-color: rgba(16, 185, 129, 0.1);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
        }

        .drop-target-invalid::before {
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
        }

        /* Drop target feedback indicators */
        .drop-target-valid::after {
          content: '✓';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background-color: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          z-index: 11;
        }

        .drop-target-invalid::after {
          content: '✗';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background-color: #ef4444;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          z-index: 11;
        }

        /* Keyboard drag indicators */
        .keyboard-dragging {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        /* Focus indicators for keyboard navigation */
        .draggable-schedule-object:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .draggable-schedule-object:focus:not(:focus-visible) {
          outline: none;
        }

        /* Animation keyframes */
        @keyframes pulse-warning {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          .draggable-schedule-object,
          .drop-target-highlight,
          [data-drop-target] {
            transition: none;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .draggable-schedule-object {
            min-width: 120px;
            padding: 8px;
          }

          .drop-target-valid::after,
          .drop-target-invalid::after {
            width: 16px;
            height: 16px;
            font-size: 10px;
          }
        }
      `;
      
      document.head.appendChild(style);
    }

    // Cleanup function
    return () => {
      const existingStyle = document.querySelector('#drag-system-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
}

export default DragStyleProvider;
