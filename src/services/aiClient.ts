import { EventDetails, PlanoraEventData, PlanProposal, AiPlanRecommendation } from '../types';

export interface GeneratePlanResponse {
  success: boolean;
  plan?: AiPlanRecommendation;
  error?: string;
  message?: string;
}

export interface ChatResponse {
  success: boolean;
  reply?: string;
  proposal?: PlanProposal | null;
  error?: string;
  message?: string;
}

export async function requestAiPlan(
  event: EventDetails,
  signal?: AbortSignal
): Promise<GeneratePlanResponse> {
  try {
    const res = await fetch('/api/ai/generate-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event }),
      signal,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Server returned an error',
        message: data.message || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      success: true,
      plan: data.plan,
    };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | null | undefined;
    if (errorObj?.name === 'AbortError') {
      return {
        success: false,
        error: 'Request cancelled',
        message: 'The planning request was cancelled.',
      };
    }
    return {
      success: false,
      error: 'Network or server error',
      message: errorObj?.message || 'Could not connect to Planora AI server.',
    };
  }
}

export async function sendChatMessage(
  eventData: PlanoraEventData,
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<ChatResponse> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventData,
        userMessage,
        chatHistory,
      }),
      signal,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Chat processing error',
        message: data.message || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      success: true,
      reply: data.reply,
      proposal: data.proposal,
    };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | null | undefined;
    if (errorObj?.name === 'AbortError') {
      return {
        success: false,
        error: 'Request cancelled',
        message: 'The assistant message was cancelled.',
      };
    }
    return {
      success: false,
      error: 'Network or server error',
      message: errorObj?.message || 'Could not communicate with the assistant server.',
    };
  }
}
