import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, ChevronLeft, Search, MoreHorizontal, Loader2, Feather } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';
import { clsx } from 'clsx';

const Messages = () => {
  const { fetchInbox, fetchThread, sendMessage, user } = useStore();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const loadInbox = async () => {
      setLoading(true);
      const data = await fetchInbox();
      setThreads(data);
      setLoading(false);
    };
    loadInbox();

    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (activeThread) {
      const loadThread = async () => {
        setMessagesLoading(true);
        const data = await fetchThread(activeThread.other_user_id);
        setMessages(data);
        setMessagesLoading(false);
        setTimeout(scrollToBottom, 100);
      };
      loadThread();
      
      // Mark as read in local state
      setThreads(prev => prev.map(t => 
        t.other_user_id === activeThread.other_user_id ? { ...t, unread_count: 0 } : t
      ));
    }
  }, [activeThread]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeThread) return;
    
    const content = inputText;
    setInputText('');
    
    // Optimistic Update
    const newMessage = {
      id: Date.now(),
      sender_id: user.id,
      recipient_id: activeThread.other_user_id,
      content,
      created_at: new Date().toISOString(),
      sender: {
        avatar_url: user.avatar_url,
        full_name: user.full_name,
      }
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(scrollToBottom, 50);

    const success = await sendMessage(activeThread.other_user_id, content);
    if (!success) {
      // Rollback or show error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    } else {
      // Update thread list with latest message
      setThreads(prev => prev.map(t => 
        t.other_user_id === activeThread.other_user_id 
        ? { ...t, last_message: content, last_message_at: new Date().toISOString() } 
        : t
      ));
    }
  };

  return (
    <div className="min-h-screen bg-bookvault-surface font-sans">
      <Navbar onUploadClick={() => {}} />
      <Sidebar activeCategory="messages" onCategoryChange={() => {}} />

      <main className="lg:pl-64 pt-20 h-screen overflow-hidden">
        <div className="h-full flex relative overflow-hidden">
          {/* Inbox Pane */}
          <section className={clsx(
            "w-full lg:w-[400px] border-r border-outline-variant/10 bg-white dark:bg-zinc-900/50 flex flex-col transition-all duration-300",
            showThreadOnMobile && isMobileView ? "-translate-x-full absolute" : "relative"
          )}>
            <div className="p-8 border-b border-outline-variant/10">
              <h1 className="text-3xl font-serif font-bold text-bookvault-primary mb-6">Messages</h1>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 group-focus-within:text-bookvault-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-bookvault-surface-low border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-12 text-center flex flex-col items-center gap-4 opacity-40">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-xs font-bold uppercase tracking-widest">Opening Letters...</p>
                </div>
              ) : threads.length > 0 ? (
                <div className="p-2 space-y-1">
                  {threads.map(thread => (
                    <button
                      key={thread.other_user_id}
                      onClick={() => {
                        setActiveThread(thread);
                        if (isMobileView) setShowThreadOnMobile(true);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-4 p-5 rounded-[24px] transition-all text-left relative group",
                        activeThread?.other_user_id === thread.other_user_id 
                          ? "bg-bookvault-primary/5 text-bookvault-primary" 
                          : "hover:bg-bookvault-surface-low"
                      )}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-bookvault-surface-low overflow-hidden border border-outline-variant/10 flex-shrink-0 relative">
                        {thread.avatar_url ? (
                          <img src={thread.avatar_url} className="w-full h-full object-cover" alt="User" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline-variant opacity-20"><User size={24} /></div>
                        )}
                        {thread.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-bookvault-secondary text-white text-[10px] font-bold rounded-lg border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
                            {thread.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-bookvault-primary truncate">{thread.full_name}</p>
                          <span className="text-[10px] text-on-surface-variant opacity-40 tabular-nums">
                            {formatRelativeTime(thread.last_message_at)}
                          </span>
                        </div>
                        <p className={clsx(
                          "text-xs truncate",
                          thread.unread_count > 0 ? "font-bold text-bookvault-secondary" : "text-on-surface-variant opacity-60"
                        )}>
                          {thread.last_message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center gap-6 opacity-20 mt-20">
                  <Feather size={60} strokeWidth={1} />
                  <p className="text-lg font-serif italic text-bookvault-primary">The postbox is empty...</p>
                  <button className="text-xs font-bold uppercase tracking-widest text-bookvault-primary underline underline-offset-4">Discover Authors to Connect</button>
                </div>
              )}
            </div>
          </section>

          {/* Conversation Pane */}
          <section className="flex-1 bg-bookvault-surface/30 relative flex flex-col">
            <AnimatePresence mode="wait">
              {activeThread ? (
                <motion.div 
                  key={activeThread.other_user_id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="h-full flex flex-col"
                >
                  {/* Thread Header */}
                  <header className="h-20 md:h-24 bg-white dark:bg-zinc-900 border-b border-outline-variant/10 px-4 md:px-8 flex items-center justify-between z-10 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      {isMobileView && (
                        <button onClick={() => setShowThreadOnMobile(false)} className="p-2 hover:bg-black/5 rounded-xl">
                          <ChevronLeft size={20} />
                        </button>
                      )}
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-bookvault-surface-low overflow-hidden border border-outline-variant/10 flex-shrink-0">
                        {activeThread.avatar_url ? (
                          <img src={activeThread.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline-variant opacity-20"><User size={20} /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-bookvault-primary text-base md:text-lg truncate">{activeThread.full_name}</p>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 truncate">@{activeThread.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                       <button className="p-2 md:p-3 hover:bg-black/5 rounded-2xl transition-colors opacity-40 hover:opacity-100">
                          <MoreHorizontal size={20} />
                       </button>
                    </div>
                  </header>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#FDFCFA] dark:bg-transparent">
                    {messagesLoading ? (
                      <div className="h-full flex items-center justify-center opacity-40 italic">Retrieving parchment...</div>
                    ) : (
                      <>
                        <div className="flex flex-col items-center py-10 opacity-20 gap-4">
                           <Feather size={32} />
                           <p className="text-[10px] font-bold uppercase tracking-[0.2em] max-w-[200px] text-center">Conversation started with {activeThread.full_name}</p>
                        </div>
                        {messages.map((msg, index) => {
                          const isOwn = msg.sender_id === user.id;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={clsx(
                                "flex flex-col",
                                isOwn ? "items-end" : "items-start"
                              )}
                            >
                              <div className={clsx(
                                "max-w-[70%] px-6 py-4 rounded-[32px] shadow-sm relative",
                                isOwn 
                                  ? "bg-bookvault-primary text-white rounded-tr-none" 
                                  : "bg-white dark:bg-zinc-800 text-bookvault-primary rounded-tl-none border border-outline-variant/10"
                              )}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <span className={clsx(
                                  "text-[9px] mt-2 block tabular-nums",
                                  isOwn ? "text-white/40" : "text-on-surface-variant opacity-40"
                                )}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                   {/* Message Input */}
                  <div className="p-4 md:p-8 pb-32 md:pb-12 bg-white dark:bg-zinc-900 border-t border-outline-variant/10 flex-shrink-0">
                    <div className="max-w-4xl mx-auto relative group flex items-end gap-2">
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Message ${activeThread.full_name.split(' ')[0]}...`}
                        className="flex-1 bg-bookvault-surface-low border-2 border-transparent focus:border-bookvault-primary/20 rounded-[24px] md:rounded-[32px] p-4 md:p-6 text-bookvault-primary outline-none transition-all resize-none min-h-[52px] max-h-40 leading-relaxed shadow-sm text-sm"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="w-12 h-12 md:w-14 md:h-14 bg-bookvault-primary text-white rounded-2xl flex items-center justify-center shadow-premium hover:bg-bookvault-primary-container disabled:opacity-20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center p-12 text-center opacity-20"
                >
                   <div className="w-24 h-24 rounded-full bg-bookvault-surface-low flex items-center justify-center mb-8 border border-outline-variant/10">
                      <Feather size={48} />
                   </div>
                   <h2 className="text-3xl font-serif font-bold text-bookvault-primary mb-4">No Conversation Selected</h2>
                   <p className="text-lg font-serif italic max-w-sm">Select an author from the left to read their letters and share your story.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 2px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default Messages;
