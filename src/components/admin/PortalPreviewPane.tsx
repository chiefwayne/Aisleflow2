'use client';

import React from 'react';

interface PortalPreviewPaneProps {
  children: React.ReactNode;
  label?: string;
  /** Shown beside the label, e.g. a Save button. */
  actions?: React.ReactNode;
}

/** Unframed, scrollable live preview of the guest portal for the admin editors. */
export default function PortalPreviewPane({ children, label = 'Live preview', actions }: PortalPreviewPaneProps) {
  return (
    <div className="lg:sticky lg:top-24 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-aisle-border bg-white px-3 py-1 text-xs font-medium text-aisle-warm shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {label}
        </div>
        {actions}
      </div>
      {/* translateZ(0) keeps the portal's fixed-position overlays inside this pane */}
      <div className="h-[70vh] lg:h-[calc(100vh-9rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-aisle-border shadow-sm [transform:translateZ(0)]">
        {children}
      </div>
    </div>
  );
}
