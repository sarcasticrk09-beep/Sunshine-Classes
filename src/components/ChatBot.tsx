/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SunshineLogo from './SunshineLogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Namaste! Welcome to **Sunshine Classes, Pihani** ☀️\n\nI am your AI Academic Assistant. I can help you with admission inquiries, fee structure, board preparation tips, and our batches. How can I guide your academic journey today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: data.response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot response failed:", error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: "I am having trouble reaching the main server. Please feel free to call our representative directly at **8707738284** for instant assistance!",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "Classes offered & Monthly Fees",
    "Where is the center located?",
    "Class 10 Board preparation tips",
    "Contact calling number & WhatsApp"
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
          <motion.button
            id="btn-chatbot-toggle"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange text-white shadow-lg hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-300"
          >
            <MessageSquare size={24} />
          </motion.button>
        </div>
      )}

      {/* Expanded Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed right-4 bottom-24 z-50 flex h-[500px] w-[calc(100vw-2rem)] max-w-[360px] md:max-w-[400px] md:right-6 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-brand-blue px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-0.5 shadow-inner">
                  <SunshineLogo size={28} showText={false} />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-sm">Sunshine Classes AI</h4>
                  <span className="flex items-center gap-1 text-[10px] text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span> Academic Guide
                  </span>
                </div>
              </div>
              <button
                id="btn-chatbot-close"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div
              id="chatbot-messages-container"
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-slate-50 p-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-blue text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                    }`}
                  >
                    {/* Parse very basic markdown list blocks and bold formatting */}
                    <div className="whitespace-pre-wrap">
                      {msg.text.split('\n').map((line, idx) => {
                        let styledLine = line;
                        // Replace **bold**
                        styledLine = styledLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        // Replace inline list elements
                        if (styledLine.trim().startsWith('- ')) {
                          return (
                            <li
                              key={idx}
                              className="ml-3 list-disc"
                              dangerouslySetInnerHTML={{ __html: styledLine.substring(2) }}
                            />
                          );
                        }
                        return (
                          <p
                            key={idx}
                            className="mb-1 last:mb-0"
                            dangerouslySetInnerHTML={{ __html: styledLine }}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={`mt-1 block text-[9px] text-right ${
                        msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm rounded-bl-none">
                    <RefreshCw size={12} className="animate-spin text-brand-orange" />
                    <span className="text-[10px] text-slate-400">Sunshine AI thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div id="chatbot-suggestions" className="border-t border-slate-100 bg-white p-2">
              <span className="mb-1 block px-2 text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                Frequently Asked
              </span>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    id={`btn-chat-suggest-${idx}`}
                    onClick={() => handleSendMessage(q)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:bg-brand-blue hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              id="chatbot-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
            >
              <input
                id="chatbot-input"
                type="text"
                placeholder="Ask your homework or admission doubt..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brand-blue focus:bg-white"
              />
              <button
                id="btn-chatbot-send"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white shadow-md transition-colors hover:bg-brand-blue-hover disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
