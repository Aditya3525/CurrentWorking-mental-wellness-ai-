import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { assessmentsApi, AssessmentSessionSummary } from '../services/api';

type SessionState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  session: AssessmentSessionSummary | null;
  error?: string | null;
};

export function useAssessmentSession() {
  const [state, setState] = useState<SessionState>({ status: 'idle', session: null });
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setState((prev) => ({ ...prev, status: prev.session ? 'ready' : 'loading', error: null }));

    try {
      const response = await assessmentsApi.getActiveAssessmentSession();
      if (response.success) {
        const session = response.data?.session ?? null;
        setState({ status: 'ready', session, error: null });
      } else {
        setState({ status: 'error', session: null, error: response.error ?? 'Unable to load session' });
      }
    } catch (error) {
      setState({
        status: 'error',
        session: null,
        error: error instanceof Error ? error.message : 'Unable to load session'
      });
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const startSession = useCallback(async (selectedTypes: string[]) => {
    if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) {
      throw new Error('Please select at least one assessment to start your check-in.');
    }

    setState({ status: 'loading', session: null });

    const response = await assessmentsApi.startAssessmentSession({ selectedTypes });
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Unable to start assessment session.');
    }

    setState({ status: 'ready', session: response.data.session, error: null });
    return response.data.session;
  }, []);

  const updateStatus = useCallback(async (sessionId: string, status: 'completed' | 'cancelled') => {
    if (!sessionId) {
      throw new Error('Missing session identifier');
    }

    const response = await assessmentsApi.updateAssessmentSessionStatus(sessionId, status);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Unable to update session status.');
    }

    setState({ status: 'ready', session: response.data.session, error: null });
    return response.data.session;
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      session: state.session,
      error: state.error ?? null,
      refresh,
      startSession,
      updateStatus
    }),
    [state, refresh, startSession, updateStatus]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return value;
}
