import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">{title}</h1>
        <p className="text-text-secondary mt-1">{description}</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-card-elevated border border-border-subtle flex items-center justify-center mb-4">
             <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Work in Progress</h3>
          <p className="text-text-secondary max-w-sm">This module is currently being visually upgraded from the Streamlit implementation.</p>
        </CardContent>
      </Card>
    </div>
  );
}
