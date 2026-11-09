import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { useErrorLogStore } from '@/store';

import { leaveForHome } from '../hooks';
import { CrashView } from './CrashView';

type CrashBoundaryProps = { children: ReactNode };
type CrashBoundaryState = { crashed: boolean };

/** Catches a crash while a screen renders, logs it and shows `CrashView` in the screen's place. */
export class CrashBoundary extends Component<CrashBoundaryProps, CrashBoundaryState> {
  override state: CrashBoundaryState = { crashed: false };

  static getDerivedStateFromError(): CrashBoundaryState {
    return { crashed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    useErrorLogStore.getState().record(error, { fatal: true, componentStack: info.componentStack });
  }

  private readonly retry = () => this.setState({ crashed: false });

  override render() {
    if (this.state.crashed) return <CrashView onRetry={this.retry} onHome={leaveForHome} />;

    return this.props.children;
  }
}
