import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-white p-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-navy">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-500">An unexpected error occurred. Please refresh the page.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}