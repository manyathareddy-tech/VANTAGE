import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { ChatMessage } from '../types';
import { Header } from '../components/common/Header';
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const ChatbotScreen: React.FC = () => {
  const { business_id, business_name } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! I am your VANTAGE financial intelligence assistant for ${business_name || 'your MSME'}. Ask me about your cash runway, burn rate, upcoming tax obligations, or flagged inventory stockouts.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || !business_id || isTyping) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    // Optimistically show user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.askChatbot(business_id, query);
      const botMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'error',
        text: `Error connecting to assistant: ${err.message || 'Unable to retrieve answer from server.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-new',
        sender: 'bot',
        text: `Chat session reset. Answers remain grounded in your uploaded data.`,
        timestamp: new Date(),
      },
    ]);
  };

  const samplePrompts = [
    'What is our current cash runway?',
    'Which SKUs are at risk of stocking out?',
    'What are the key tax deadlines this month?',
    'How can we reduce our monthly burn rate?',
  ];

  return (
    <div className="flex-1 min-h-screen bg-[#e8e5f0]/60 flex flex-col pb-20 md:pb-6">
      <Header
        title="Chatbot"
        subtitle="Answers are grounded in your uploaded data"
      />

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* Main Chat Container */}
        <div className="bg-white rounded-2xl shadow-xs border border-[#d6d0e6] flex-1 flex flex-col overflow-hidden min-h-[550px]">
          {/* Chat Header Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#fbfafc]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3d3358] text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#3d3358] flex items-center gap-1.5">
                  <span>VANTAGE Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h3>
                <p className="text-[11px] text-slate-500">Answers are grounded in your uploaded data</p>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              title="Reset conversation history"
              className="p-1.5 text-slate-400 hover:text-[#3d3358] hover:bg-[#e8e5f0] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end items-start gap-2.5">
                    <div className="max-w-[80%] sm:max-w-[70%] bg-[#3d3358] text-white p-4 rounded-2xl rounded-tr-none shadow-xs text-sm leading-relaxed">
                      {msg.text}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#3d3358]/20 text-[#3d3358] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                );
              }

              if (msg.sender === 'error') {
                return (
                  <div key={msg.id} className="flex justify-start items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-1">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="max-w-[80%] sm:max-w-[70%] bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl rounded-tl-none shadow-xs text-xs sm:text-sm leading-relaxed">
                      <span className="font-semibold block mb-0.5">Telemetry Query Error:</span>
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Bot Message
              return (
                <div key={msg.id} className="flex justify-start items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[75%] bg-[#fbfafc] border border-[#d6d0e6] text-slate-800 p-4 rounded-2xl rounded-tl-none shadow-xs text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start items-start gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-[#e8e5f0] text-[#3d3358] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#fbfafc] border border-[#d6d0e6] text-slate-500 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs text-xs flex items-center gap-2">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-[#3d3358] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#3d3358] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#3d3358] rounded-full animate-bounce"></span>
                  </span>
                  <span>Synthesizing answer from telemetry records...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 sm:px-6 py-2 border-t border-slate-100 bg-[#fbfafc] flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Suggestions:</span>
              </span>
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="px-3 py-1 bg-white hover:bg-[#e8e5f0] border border-[#d6d0e6] rounded-full text-xs text-slate-700 whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cash flow, runway, inventory risks, or tax deductions..."
                disabled={isTyping}
                className="flex-1 px-4 py-3 bg-[#e8e5f0]/40 border border-[#d6d0e6] rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3d3358] focus:border-transparent text-sm font-medium transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-[#3d3358] hover:bg-[#2d2642] active:bg-[#231b35] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
