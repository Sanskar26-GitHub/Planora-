import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { PlanoraEventData, ChatMessage, PlanProposal } from '../types';
import { sendChatMessage } from '../services/aiClient';
import { storage } from '../services/storage';
import { formatCurrency } from '../utils/calculations';

interface AiAssistantProps {
  eventData: PlanoraEventData;
  onRefresh: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ eventData, onRefresh }) => {
  const { event, chatHistory } = eventData;
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Proposal modal state
  const [selectedProposal, setSelectedProposal] = useState<PlanProposal | null>(null);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProposal) {
        setSelectedProposal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProposal]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isLoading) return;

    setErrorMsg(null);
    setApplyFeedback(null);
    setInputText('');

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };
    storage.addChatMessage(event.id, userMsg);
    onRefresh();

    setIsLoading(true);

    // Create abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const historyFormatted = chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(
        eventData,
        textToSend.trim(),
        historyFormatted,
        abortController.signal
      );

      if (res.success && res.reply) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toISOString(),
          proposal: res.proposal || undefined,
        };
        storage.addChatMessage(event.id, assistantMsg);
        onRefresh();
      } else {
        setErrorMsg(res.message || 'Failed to receive assistant response.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMsg(err?.message || 'Error communicating with assistant.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyProposal = (proposalId: string) => {
    const result = storage.applyProposal(event.id, proposalId);
    if (result.success) {
      setApplyFeedback(result.message);
      setSelectedProposal(null);
      onRefresh();
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDismissProposal = (proposalId: string) => {
    storage.dismissProposal(event.id, proposalId);
    setSelectedProposal(null);
    onRefresh();
  };

  const quickPrompts = [
    'Suggest budget tradeoffs to save 15%',
    'Adapt plan for 50 additional guests',
    'Add bad weather indoor contingency tasks',
    'Review timeline milestones and suggest next priority',
    'Recommend sustainable eco-friendly decor ideas',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[550px] bg-[#fbf9f5] border border-[#e7e1d7] rounded-2xl shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-[#e7e1d7] bg-[#f8f6f0] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1b4332] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#e9c46a]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#142d22]">Planora AI Event Strategist</h1>
            <div className="text-[11px] text-[#716859]">
              Active Event: <strong>{event.name}</strong> ·{' '}
              {formatCurrency(event.totalBudget, event.currency)} budget
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#716859] bg-[#ede7dd] px-2.5 py-1 rounded-md">
          <Shield className="w-3.5 h-3.5 text-[#1b4332]" />
          <span>Proposed changes require confirmation</span>
        </div>
      </div>

      {/* Applied Feedback Notification */}
      {applyFeedback && (
        <div className="p-3 bg-[#dcfce7] border-b border-[#bbf7d0] text-xs text-[#166534] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
            <span>{applyFeedback}</span>
          </div>
          <button onClick={() => setApplyFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-[#fef2f2] border-b border-[#fecaca] text-xs text-[#991b1b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {chatHistory.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className="flex items-center gap-2 text-[10px] text-[#8c8273] px-1">
                <span>{isUser ? 'You' : 'Planora AI'}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#1b4332] text-white rounded-tr-xs'
                    : 'bg-[#f4efe6] text-[#2c261e] border border-[#e5ded2] rounded-tl-xs whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>

              {/* Proposal Action Card (if message returned a proposal) */}
              {msg.proposal && (
                <div className="max-w-[85%] sm:max-w-[75%] bg-[#fbf9f5] border-2 border-[#1b4332]/30 rounded-xl p-3.5 space-y-2.5 mt-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#142d22]">
                      <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>{msg.proposal.summary}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-sm ${
                        msg.proposal.status === 'applied'
                          ? 'bg-[#dcfce7] text-[#166534]'
                          : msg.proposal.status === 'dismissed'
                          ? 'bg-[#f3f4f6] text-[#6b7280]'
                          : 'bg-[#fef3c7] text-[#92400e]'
                      }`}
                    >
                      {msg.proposal.status}
                    </span>
                  </div>

                  {msg.proposal.reasoning && (
                    <p className="text-[11px] text-[#5c5344] leading-relaxed">
                      {msg.proposal.reasoning}
                    </p>
                  )}

                  <div className="text-[11px] text-[#716859] space-y-1 bg-[#f4efe6] p-2 rounded-md">
                    <div className="font-semibold text-[#142d22]">Proposed Changes ({msg.proposal.changes.length}):</div>
                    {msg.proposal.changes.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-[#1b4332] font-bold">·</span>
                        <span className="capitalize font-medium text-[#1b4332]">[{c.entity}]</span>
                        <span>{c.description}</span>
                      </div>
                    ))}
                  </div>

                  {msg.proposal.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedProposal(msg.proposal || null)}
                        className="px-3 py-1.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        Review & Apply Changes
                      </button>
                      <button
                        onClick={() => handleDismissProposal(msg.proposal!.id)}
                        className="px-2.5 py-1.5 text-[#716859] hover:bg-[#ede7dd] text-xs rounded-md transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#716859] p-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#1b4332]" />
            <span>Planora AI is analyzing your plan parameters...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-[#e7e1d7] bg-[#f8f6f0] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[11px] text-[#8c8273] font-semibold flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#d97706]" />
            Prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 text-[11px] font-medium bg-[#fbf9f5] hover:bg-[#ede7dd] border border-[#dcd4c7] text-[#2c261e] rounded-md transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 border-t border-[#e7e1d7] bg-[#fbf9f5] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask about ${event.name}, request budget changes, or plan adjustments...`}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#dcd4c7] rounded-xl text-[#142d22] focus:ring-1 focus:ring-[#1b4332] focus:border-[#1b4332] outline-hidden"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message to AI assistant"
          className="px-4 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex items-center gap-1.5 shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs font-semibold">Send</span>
        </button>
      </form>

      {/* PROPOSAL CONFIRMATION MODAL */}
      {selectedProposal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4"
        >
          <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d97706]" />
                <h3 id="proposal-modal-title" className="text-base font-bold text-[#142d22]">
                  Review Proposed Plan Changes
                </h3>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-xs text-[#716859] hover:text-[#142d22]"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#f8f6f0] p-3 rounded-lg border border-[#e7e1d7] space-y-1">
                <div className="font-bold text-[#142d22]">{selectedProposal.summary}</div>
                <p className="text-[#5c5344] leading-relaxed">{selectedProposal.reasoning}</p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-[#142d22]">
                  The following updates will be written to your saved event data:
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedProposal.changes.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white border border-[#dcd4c7] rounded-md space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#1b4332]">
                        <span className="capitalize">
                          {change.action} {change.entity}
                        </span>
                      </div>
                      <div className="text-[#2c261e]">{change.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
              <button
                onClick={() => handleDismissProposal(selectedProposal.id)}
                className="px-3 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md text-xs font-medium"
              >
                Dismiss Proposal
              </button>
              <button
                onClick={() => handleApplyProposal(selectedProposal.id)}
                className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f] text-xs shadow-xs"
              >
                Confirm & Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
