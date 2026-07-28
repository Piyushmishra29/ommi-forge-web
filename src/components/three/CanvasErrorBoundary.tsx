'use client';

import { Component, type ReactNode } from 'react';

type Props = {
  /** Static, no-WebGL fallback rendered in place of the failed <Canvas>. */
  fallback: ReactNode;
  children: ReactNode;
  /** Optional hook so a parent can also disable canvas-dependent controls
   *  (rotate/reset/fullscreen toolbar buttons, tap-to-activate gate) that
   *  would otherwise sit there doing nothing once the canvas is gone. */
  onError?: () => void;
};

type State = { hasError: boolean };

/**
 * Catches WebGL context-creation failures — GPU disabled, too many live
 * contexts, ancient/locked-down browsers — that `<Canvas>` throws
 * synchronously while mounting `THREE.WebGLRenderer`. Without this, that
 * throw propagates past `<StlViewer>`/`<StlPreview>` and either blanks the
 * tile or takes out the nearest ancestor boundary (Next's route error UI).
 *
 * React error boundaries are still class-only — there is no hook
 * equivalent — so this stays a small class wrapping every 3D viewer
 * instance instead of leaving WebGL failure unhandled.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Fallback UI is already showing; this is diagnostic only.
    console.warn('3D viewer failed to initialize, showing fallback:', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default CanvasErrorBoundary;
