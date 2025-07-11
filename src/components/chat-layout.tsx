
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useChat } from '@/hooks/use-chat';
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NewChatDialog } from './new-chat-dialog';
import { Loader2, Send, Users, MessageSquare, Plus, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import type { Conversation, Message } from '@/lib/types';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/language-context';

function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  isLoading,
}: {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <p className="p-4 text-center text-sm text-muted-foreground">{t('chat.no_convos')}</p>;
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return t('chat.yesterday');
    return format(date, 'P');
  };

  return (
    <nav className="flex flex-col p-2">
      {conversations.map((convo) => {
        const otherParticipantId = convo.participants.find((p) => p !== user?.uid);
        const otherUsername = otherParticipantId ? convo.participantUsernames[otherParticipantId] : 'Unknown';
        const unreadCount = user ? convo.unreadCounts?.[user.uid] || 0 : 0;

        return (
          <button
            key={convo.id}
            onClick={() => onSelect(convo.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted',
              selectedConversationId === convo.id && 'bg-muted'
            )}
          >
            <Avatar className="h-10 w-10 border">
              <AvatarFallback>{otherUsername.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="font-semibold">{otherUsername}</p>
              <p className={cn("truncate text-sm", unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {convo.lastMessageSenderId === user?.uid && t('chat.you')}{convo.lastMessage}
              </p>
            </div>
            <div className="flex flex-col items-end self-start text-xs text-muted-foreground">
              <span>{formatTimestamp(convo.lastMessageTimestamp)}</span>
              {unreadCount > 0 && <Badge className="mt-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>}
            </div>
          </button>
        );
      })}
    </nav>
  );
}

function DateSeparator({ date }: { date: Date }) {
    const { t } = useLanguage();
    const getFormattedDate = () => {
        if (isToday(date)) return t('chat.today');
        if (isYesterday(date)) return t('chat.yesterday');
        return format(date, 'MMMM d, yyyy');
    }

    return (
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    {getFormattedDate()}
                </span>
            </div>
        </div>
    );
}

function MessageStatus({ message, otherParticipantId }: { message: Message; otherParticipantId?: string }) {
    if (message.readBy && otherParticipantId && message.readBy.includes(otherParticipantId)) {
        return <CheckCheck className="h-4 w-4 text-accent" />; // Read by other participant
    }
    return <Check className="h-4 w-4 text-primary-foreground/70" />; // Sent/Delivered
}


function ChatWindow({
  conversationId,
  otherParticipantId,
  otherUsername,
  messages,
  isLoadingMessages,
  sendMessage,
  onBack
}: {
  conversationId: string;
  otherParticipantId?: string;
  otherUsername: string | undefined;
  messages: Message[];
  isLoadingMessages: boolean;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesWithSeparators = useMemo(() => {
    const items: (Message | { type: 'separator'; id: string; date: Date })[] = [];
    let lastDate: string | null = null;

    messages.forEach((message) => {
        if (message.createdAt) {
            const messageDate = message.createdAt.toDate();
            const dateString = format(messageDate, 'yyyy-MM-dd');
            if (dateString !== lastDate) {
                items.push({
                    type: 'separator',
                    id: `sep-${dateString}`,
                    date: messageDate,
                });
                lastDate = dateString;
            }
        }
        items.push(message);
    });
    return items;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesWithSeparators]);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    await sendMessage(conversationId, text);
    setText('');
    setIsSending(false);
  };
  
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b p-4">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9 border md:hidden">
              <AvatarFallback>{otherUsername?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="font-semibold">{otherUsername || t('chat.select_convo')}</h2>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 bg-secondary/20">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {messagesWithSeparators.map((item) =>
                'type' in item && item.type === 'separator' ? (
                <DateSeparator key={item.id} date={item.date} />
                ) : (
                (() => {
                    const message = item as Message;
                    return (
                        <div
                            key={message.id}
                            className={cn('flex items-end gap-2', message.senderId === user?.uid ? 'justify-end' : 'justify-start')}
                        >
                            {message.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8 self-start border">
                                    <AvatarFallback>{message.senderName?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={cn(
                                'max-w-xs rounded-lg p-3 lg:max-w-md',
                                message.senderId === user?.uid
                                    ? 'rounded-l-lg rounded-t-lg bg-primary text-primary-foreground'
                                    : 'rounded-r-lg rounded-t-lg bg-card shadow-sm'
                                )}
                            >
                            <p className="whitespace-pre-wrap">{message.text}</p>
                            <div className="mt-1 flex items-center justify-end gap-1.5 text-xs opacity-70">
                                <span className="text-primary-foreground/70">{message.createdAt ? format(message.createdAt.toDate(), 'p') : ''}</span>
                                {message.senderId === user?.uid && (
                                    <MessageStatus message={message} otherParticipantId={otherParticipantId} />
                                )}
                            </div>
                            </div>
                        </div>
                    );
                })()
                )
            )}
             <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <footer className="border-t p-4">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('chat.type_message')}
            className="pr-12"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button type="button" size="icon" onClick={handleSend} disabled={isSending}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ChatLayout() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { t } = useLanguage();
  const { 
    conversations, 
    isLoadingConversations, 
    messages,
    isLoadingMessages,
    listenToMessages, 
    sendMessage,
    createOrGetConversation 
  } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedConversationId) {
      const unsubscribe = listenToMessages(selectedConversationId);
      return () => unsubscribe();
    }
  }, [selectedConversationId, listenToMessages]);

  const handleCreateOrSelectConversation = async (otherUser: any) => {
      const conversationId = await createOrGetConversation(otherUser);
      if(conversationId) {
          setSelectedConversationId(conversationId);
      }
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const otherParticipantId = selectedConversation?.participants.find(p => p !== user?.uid);
  const otherUsername = otherParticipantId ? selectedConversation?.participantUsernames[otherParticipantId] : undefined;
  
  const availableUsers = users.filter(u => u.uid !== user?.uid);

  return (
    <div className="container p-0">
      <div className="grid h-[calc(100vh-4rem)] md:grid-cols-[300px_1fr]">
        <div className={cn(
            'flex flex-col border-r bg-muted/20',
            selectedConversationId ? 'hidden md:flex' : 'flex'
          )}>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <h2 className="text-xl font-bold">{t('chat.title')}</h2>
            <NewChatDialog users={availableUsers} onSelectUser={handleCreateOrSelectConversation}>
                <Button variant="ghost" size="icon">
                    <Users className="h-5 w-5" />
                </Button>
            </NewChatDialog>
          </CardHeader>
          <div className="flex-1 overflow-y-auto">
             <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelect={setSelectedConversationId}
                isLoading={isLoadingConversations}
             />
          </div>
        </div>
        <div className={cn(
            'flex flex-col',
            selectedConversationId ? 'flex' : 'hidden md:flex'
        )}>
          {selectedConversationId ? (
            <ChatWindow 
              conversationId={selectedConversationId} 
              otherParticipantId={otherParticipantId}
              otherUsername={otherUsername}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              sendMessage={sendMessage}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
             <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-headline">{t('chat.welcome_title')}</h3>
                <p className="max-w-xs text-muted-foreground mt-2">
                    {t('chat.welcome_desc')}
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
