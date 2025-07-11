
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  increment,
  serverTimestamp,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import type { Conversation, Message, AuthUser } from '@/lib/types';
import { useToast } from './use-toast';
import { useChatContext } from '@/contexts/chat-context';

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversations, isLoadingConversations } = useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Hook to fetch messages for a given conversation
  const listenToMessages = useCallback((conversationId: string | null) => {
    if (!conversationId || !user) {
        setMessages([]);
        return () => {};
    }

    setIsLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const batch = writeBatch(db);
      let hasUnread = false;

      const msgs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();

        // Mark message as read by current user if they are not the sender
        if (data.senderId !== user.uid && Array.isArray(data.readBy) && !data.readBy.includes(user.uid)) {
          hasUnread = true;
          batch.update(docSnap.ref, { readBy: arrayUnion(user.uid) });
        }

        const ts = data.createdAt;
        let normalizedTs: any = ts;

        if (ts) {
          if (typeof ts.toDate !== 'function') {
            if (typeof ts.seconds === 'number') {
              normalizedTs = { toDate: () => new Date(ts.seconds * 1000) };
            } else {
              const parsedDate = new Date(ts);
              if (!isNaN(parsedDate.getTime())) {
                  normalizedTs = { toDate: () => parsedDate };
              } else {
                  normalizedTs = null;
              }
            }
          }
        } else if (docSnap.metadata.hasPendingWrites) {
          normalizedTs = { toDate: () => new Date() };
        }
        
        return {
          id: docSnap.id,
          ...data,
          readBy: data.readBy || [], // Ensure readBy is always an array
          createdAt: normalizedTs,
        }
      }) as Message[];
      setMessages(msgs);

      // Commit the read receipts update
      if (hasUnread) {
        batch.commit().catch(console.error);
      }

      // Reset unread count for the current user when they view messages
      const convoRef = doc(db, 'conversations', conversationId);
      getDoc(convoRef).then(docSnap => {
          if (docSnap.exists()) {
              const currentUnread = docSnap.data().unreadCounts?.[user.uid] || 0;
              if (currentUnread > 0) {
                  updateDoc(convoRef, {
                      [`unreadCounts.${user.uid}`]: 0
                  }).catch(console.error);
              }
          }
      });

      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoadingMessages(false);
    });

    return unsubscribe;
  }, [user]);

  // Function to send a message
  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    if (!user || !user.username) return;
    if (!text.trim()) {
      return;
    }

    const messageData: Omit<Message, 'id'> = {
      conversationId,
      senderId: user.uid,
      senderName: user.username,
      text: text,
      createdAt: serverTimestamp(),
      readBy: [user.uid], // Sender has implicitly read it
    };
    
    const lastMessageText = text.trim();

    try {
      const batch = writeBatch(db);
      const conversationRef = doc(db, 'conversations', conversationId);
      const newMessageRef = doc(collection(conversationRef, 'messages'));
      
      batch.set(newMessageRef, messageData);

      const convoDoc = await getDoc(conversationRef);
        if (convoDoc.exists()) {
            const convoData = convoDoc.data() as Conversation;
            const updatePayload: any = {
                lastMessage: lastMessageText.length > 40 ? `${lastMessageText.substring(0, 37)}...` : lastMessageText,
                lastMessageTimestamp: serverTimestamp(),
                lastMessageSenderId: user.uid,
            };

            convoData.participants.forEach(participantId => {
                if (participantId !== user.uid) {
                    updatePayload[`unreadCounts.${participantId}`] = increment(1);
                }
            });
            batch.update(conversationRef, updatePayload);
        }

      await batch.commit();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Could not send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Function to create a new conversation
  const createOrGetConversation = useCallback(async (otherUser: AuthUser): Promise<string | null> => {
    if (!user?.activeTenantId || !user.username) return null;

    const participants = [user.uid, otherUser.uid].sort();
    
    // Check if a conversation already exists for this tenant
    const q = query(
        collection(db, 'conversations'), 
        where('participants', '==', participants),
        where('tenantId', '==', user.activeTenantId)
    );
    const existingConvos = await getDocs(q);

    if (!existingConvos.empty) {
        return existingConvos.docs[0].id;
    }

    // Create a new one
    try {
      const batch = writeBatch(db);
      const newConvoRef = doc(collection(db, 'conversations'));
      batch.set(newConvoRef, {
        participants,
        tenantId: user.activeTenantId,
        participantUsernames: {
          [user.uid]: user.username,
          [otherUser.uid]: otherUser.username,
        },
        createdAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp(),
        unreadCounts: {
            [user.uid]: 0,
            [otherUser.uid]: 0,
        }
      });
      await batch.commit();
      return newConvoRef.id;
    } catch (error) {
        console.error("Error creating conversation:", error);
        toast({ title: 'Error', description: 'Could not start a new chat.', variant: 'destructive' });
        return null;
    }
  }, [user, toast]);

  return { 
      conversations,
      messages, 
      listenToMessages,
      sendMessage, 
      createOrGetConversation,
      isLoadingConversations,
      isLoadingMessages
    };
}
