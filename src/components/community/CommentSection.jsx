

import React, { useState, useEffect } from 'react';
import { Send, Heart, Reply, Trash2, Flag, MessageSquare, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';
import { formatRelativeTime } from '../../utils/dateUtils';

const Comment = ({ comment, depth = 0, onReply, onLike, onDelete, isLiked, storyAuthorId }) => {
  const { user } = useStore();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "group relative",
        depth > 0 ? "ml-8 mt-4 pl-4 border-l-2 border-outline-variant/10" : "mt-8"
      )}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-bookvault-surface-low overflow-hidden border border-outline-variant/10 flex-shrink-0">
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" alt="User" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 font-bold uppercase">
              {comment.profiles?.full_name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-bookvault-primary text-sm">{comment.profiles?.full_name}</span>
            <span className="text-[10px] text-on-surface-variant opacity-40 uppercase tracking-widest">
              {formatRelativeTime(comment.created_at)} ago
            </span>
          </div>

          <div className={clsx(
            "text-on-surface-variant text-sm leading-relaxed mb-3",
            comment.is_deleted && "italic opacity-40"
          )}>
            {comment.content}
          </div>

          {!comment.is_deleted && (
            <div className="flex items-center gap-6">
              <button
                onClick={() => onLike(comment.id)}
                className={clsx(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors",
                  isLiked ? "text-red-500" : "text-on-surface-variant opacity-40 hover:opacity-100"
                )}
              >
                <Heart size={14} className={isLiked ? "fill-current" : ""} />
                {comment.likes_count || 0}
              </button>

              {depth < 1 && ( // Only allow 2 levels total (0 and 1)
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 hover:opacity-100 transition-colors"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}

              {(user?.id === comment.user_id || user?.id === storyAuthorId) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}

              <button 
                onClick={() => {
                  const reason = window.prompt("Reason for reporting this comment?");
                  if (reason) {
                    useStore.getState().reportContent({
                      targetType: 'comment',
                      targetId: comment.id,
                      reason
                    });
                    alert("Thank you. Our moderators will review this.");
                  }
                }}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 hover:opacity-40 transition-colors"
              >
                <Flag size={14} />
                Report
              </button>
            </div>
          )}

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="relative">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-bookvault-surface-low border border-outline-variant/10 rounded-2xl p-4 pr-12 text-sm focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none min-h-[80px] resize-none"
                  />
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-bookvault-primary text-white rounded-xl shadow-premium hover:bg-bookvault-primary-container disabled:opacity-20 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export const CommentSection = ({ storyId, chapterId = null, storyAuthorId }) => {
  const { user, fetchComments, postComment, deleteComment, toggleCommentLike, userCommentLikes } = useStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'popular'

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(storyId, chapterId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [storyId, chapterId]);

  const handlePost = async (parentId = null, contentOverride = null) => {
    const content = contentOverride || newComment;
    if (!content.trim() || !user) return;

    setIsPosting(true);
    const res = await postComment({
      storyId,
      chapterId: chapterId,
      parentId,
      content
    });

    if (res) {
      if (parentId) {
        // Deep clone and update nested comment
        setComments(prev => [res, ...prev]);
      } else {
        setComments(prev => [res, ...prev]);
        setNewComment('');
      }
      // Re-load to get correct structure if needed, or just append
      loadComments();
    }
    setIsPosting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const ok = await deleteComment(id);
      if (ok) {
        setComments(prev => prev.map(c =>
          c.id === id ? { ...c, is_deleted: true, content: '[Comment deleted by user]' } : c
        ));
      }
    }
  };

  const handleLike = (id) => {
    toggleCommentLike(id);
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        const isLiked = userCommentLikes.includes(id);
        return { ...c, likes_count: isLiked ? (c.likes_count || 1) - 1 : (c.likes_count || 0) + 1 };
      }
      return c;
    }));
  };

  // Nesting Logic
  const topLevelComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const sortedComments = [...topLevelComments].sort((a, b) => {
    if (sortBy === 'popular') return (b.likes_count || 0) - (a.likes_count || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="mt-20 border-t border-outline-variant/10 pt-20 pb-40 px-4 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bookvault-primary-container/10 flex items-center justify-center text-bookvault-primary">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-3xl font-serif font-bold text-bookvault-primary">The Reading Circle</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Share your thoughts on the manuscript</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 mr-2">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-bookvault-surface-low border border-outline-variant/10 rounded-xl px-4 py-2 text-xs font-bold text-bookvault-primary focus:ring-1 focus:ring-bookvault-primary/20 transition-all outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Top Liked</option>
          </select>
        </div>
      </div>

      {/* Main Input */}
      {user ? (
        <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] p-6 border border-outline-variant/10 shadow-premium mb-16">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your resonance with this chapter..."
            className="w-full bg-transparent border-none text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-on-surface-variant/20 focus:ring-0 transition-all outline-none min-h-[120px] resize-none mb-4"
          />
          <div className="flex items-center justify-between border-t border-outline-variant/5 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bookvault-surface-low overflow-hidden border border-outline-variant/10">
                {user?.avatar_url && <img src={user.avatar_url} className="w-full h-full object-cover" />}
              </div>
              <span className="text-xs font-bold text-on-surface-variant/40">Posting as {user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={() => handlePost()}
              disabled={!newComment.trim() || isPosting}
              className={clsx(
                "px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 group min-w-[160px] justify-center",
                newComment.trim() && !isPosting
                  ? "bg-bookvault-primary text-white shadow-premium hover:bg-bookvault-primary-container hover:scale-[1.02]" 
                  : "bg-bookvault-surface-low text-on-surface-variant/20 cursor-not-allowed"
              )}
            >
              {isPosting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Sending...
                </>
              ) : (
                <>
                  <Send size={18} className={clsx(
                    "transition-transform",
                    newComment.trim() && "group-hover:translate-x-1 group-hover:-translate-y-1"
                  )} /> Post Comment
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-bookvault-surface-low/30 rounded-[32px] border border-dashed border-outline-variant/20 mb-16">
          <p className="text-on-surface-variant italic opacity-60 mb-6">Join the community to share your thoughts...</p>
          <button className="px-8 py-3 bg-white text-bookvault-primary rounded-xl font-bold shadow-sm border border-bookvault-primary/10">Sign In to Comment</button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center opacity-40 italic">Assembling thoughts...</div>
        ) : sortedComments.length > 0 ? (
          sortedComments.map(comment => (
            <div key={comment.id}>
              <Comment
                comment={comment}
                onReply={(pid, content) => handlePost(pid, content)}
                onLike={handleLike}
                onDelete={handleDelete}
                isLiked={userCommentLikes.includes(comment.id)}
                storyAuthorId={storyAuthorId}
              />
              {/* Render 1 level of replies */}
              <div className="space-y-2">
                {replies.filter(r => r.parent_id === comment.id).map(reply => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    depth={1}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    isLiked={userCommentLikes.includes(reply.id)}
                    storyAuthorId={storyAuthorId}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-6 opacity-20">
            <MessageSquare size={60} strokeWidth={1} />
            <p className="text-xl font-serif italic">Silence is golden, but expression is silver...</p>
          </div>
        )}
      </div>
    </div>
  );
};
