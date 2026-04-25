import { supabase } from './supabase';

/**
 * THE ZEN LOCKDOWN MUTEX
 * This singleton ensures that only ONE Resonance channel can exist at any time globally.
 * It is isolated from the UI store to prevent React-lifecycle race conditions.
 */

let resonanceChannel = null;
let connectionLock = false;
let retryCount = 0;
const MAX_RETRIES = 5;

export const establishResonancePresence = (userId, onMessage) => {
  // If we are currently connecting, or already have a live channel, do nothing.
  const isEngaged = resonanceChannel && (resonanceChannel.state === 'joined' || resonanceChannel.state === 'joining');
  if (connectionLock || isEngaged) {
    return null;
  }

  connectionLock = true;
  
  try {
    // 1. Force cleanup of any previous attempts
    if (resonanceChannel) {
      console.log('🧹 Zen Cleanup: Stripping old Resonance channel...');
      supabase.removeChannel(resonanceChannel);
    }

    console.log('🔌 Zen Lockdown: Establishing Singleton Resonance Channel...');

    const channel = supabase.channel(`resonance_${userId}`, {
      config: {
        broadcast: { self: false },
      }
    });

    resonanceChannel = channel;
    
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        console.log('✨ Zen Resonance Received:', payload);
        if (onMessage) onMessage(payload);
      }
    ).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Zen Lockdown: Resonance Singleton Active.');
        connectionLock = false;
        retryCount = 0; // Reset on success
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Only log failures as warnings to keep console clean, unless max retries reached
        if (retryCount < MAX_RETRIES - 1) {
           console.warn(`⚠️ Zen Lockdown: Resonance temporary issue (${status}). Recovering...`);
        } else {
           console.error('❌ Zen Lockdown: Resonance persistent failure:', status);
        }
        
        connectionLock = false;
        
        // Cleanup on failure
        supabase.removeChannel(channel);
        resonanceChannel = null;
        
        if (status === 'TIMED_OUT' && retryCount < MAX_RETRIES) {
           retryCount++;
           const delay = Math.min(5000 * retryCount, 30000); // More conservative backoff
           setTimeout(() => establishResonancePresence(userId, onMessage), delay);
        } else if (retryCount >= MAX_RETRIES) {
           console.warn('🛑 Zen Lockdown: Max Resonance retries reached. Realtime status disabled for this session.');
        }
      }
    });

    return resonanceChannel;
  } catch (err) {
    console.error('❌ Zen Critical Failure:', err);
    connectionLock = false;
    return null;
  }
};

export const terminateResonancePresence = () => {
  if (resonanceChannel) {
    console.log('🔌 Zen Lockdown: Terminating Resonance Singleton...');
    supabase.removeChannel(resonanceChannel);
    resonanceChannel = null;
    connectionLock = false;
  }
};
