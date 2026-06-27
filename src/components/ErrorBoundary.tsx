"use client";

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Memra ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0b0b09',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          color: '#c8956c',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Archive Error
          </div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#e8e3d8',
            fontWeight: 300
          }}>
            Something went wrong rendering this archive.
          </div>
          <div style={{ fontSize: '11px', color: '#6a6458', maxWidth: '400px', lineHeight: 1.7 }}>
            Your chat data is still safe on your device. Try uploading again.
          </div>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              marginTop: '16px',
              background: '#c8956c',
              color: '#0b0b09',
              border: 'none',
              padding: '12px 28px',
              fontFamily: 'monospace',
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Start Over
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
