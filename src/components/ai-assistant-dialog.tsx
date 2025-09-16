"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useInvoices } from '@/hooks/use-invoices';
import { useInventory } from '@/hooks/use-inventory';
import { useCustomers } from '@/hooks/use-customers';
import { useExpenses } from '@/hooks/use-expenses';
import { useReturns } from '@/hooks/use-returns';
import { useSuppliers } from '@/hooks/use-suppliers';
import { businessAnalyst } from '@/ai/flows/business-analyst-flow';
import { useAI } from '@/contexts/ai-context';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export default function AIAssistantDialog() {
  const { isAssistantOpen, toggleAssistant } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { locale } = useLanguage();

  // Hooks to gather all the necessary data
  const { user } = useAuth();
  const { invoices } = useInvoices();
  const { inventory } = useInventory();
  const { customers } = useCustomers();
  const { expenses } = useExpenses();
  const { returns } = useReturns();
  const { suppliers } = useSuppliers();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if(isAssistantOpen) {
        setMessages([{
            id: 1,
            text: `Hello ${user?.username}! I'm your AI business analyst. How can I help you analyze your data today? You can ask me questions like "What was my total profit last month?" or "Which product is the most profitable?".`,
            sender: 'ai'
        }]);
    }
  }, [isAssistantOpen, user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await businessAnalyst({
            question: input,
            customers,
            inventory,
            invoices,
            expenses,
            returns,
            suppliers,
            locale,
        });

        const aiMessage: Message = { id: Date.now() + 1, text: response.answer, sender: 'ai' };
        setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
        console.error("AI Assistant Error:", error);
        const errorMessage: Message = {
            id: Date.now() + 1,
            text: "Sorry, I encountered an error trying to answer your question. Please try again.",
            sender: 'ai',
        };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={toggleAssistant}
      >
        <Sparkles className="h-7 w-7" />
      </Button>

      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] bg-card border shadow-2xl flex flex-col sm:rounded-2xl">
              <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-lg">AI Business Analyst</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleAssistant} className="h-8 w-8">
                  <X className="h-5 w-5" />
                </Button>
              </header>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex items-end gap-2 text-sm',
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-xs rounded-lg p-3',
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="max-w-xs rounded-lg p-3 bg-muted flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           <span>Analyzing...</span>
                        </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <footer className="p-4 border-t flex-shrink-0">
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your business..."
                    className="pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleSend}
                    disabled={isLoading}
                    className="absolute bottom-2.5 right-2.5 h-8 w-8"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </footer>
            </div>
        </div>
      )}
    </>
  );
}
