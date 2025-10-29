'use client';

import { ReactNode } from 'react';

interface AccordionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: string | number;
}

export default function Accordion({ title, isExpanded, onToggle, children, badge }: AccordionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Chevron Icon */}
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>

          {/* Badge */}
          {badge !== undefined && badge !== null && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-semibold px-2.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
