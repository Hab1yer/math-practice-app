import { Component } from 'react';
import type { ReactNode } from 'react';
import { logDevelopmentError } from '../../services/developmentLog';
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    logDevelopmentError('Unable to display practice', error);
  }
  render() {
    return this.state.failed ? (
      <main className="page" id="main-content">
        <h1>Let’s try again</h1>
        <p role="alert">
          This page could not be opened. Saved answers are still in this browser
          when storage is available.
        </p>
        <button
          className="button-link"
          onClick={() => window.location.assign('/')}
        >
          Return Home
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
