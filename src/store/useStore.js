import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deleteBookFile, saveBookFile, getBookFile } from '../utils/bookStorage'
import { supabase } from '../lib/supabase'
import { mockDatabase } from '../lib/mockDatabase'
import { establishResonancePresence, terminateResonancePresence } from '../lib/realtime'

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      books: [],
      currentBook: null,
      lastActionAt: 0,
      readingProgress: {}, // { bookId: { location, percentage, lastRead } }
      annotations: {}, // { bookId: [{ id, type, text, color, note, location }] }
      bookmarks: {}, // { bookId: [{ id, label, location }] }
      userStats: { totalReadingTimeMs: 0, totalPagesRead: 0 }, 
      theme: 'light',
      searchQuery: '',
      customColors: ['#FFEB3B', '#2196F3', '#FF4081', '#9E9E9E'], // Presets
      readerSettings: {
        fontSize: 16,
        fontFamily: 'serif',
        lineSpacing: 1.5,
        theme: 'light'
      },
      fileBlobs: {},
      userProfile: { 
        fullName: '', 
        username: '', 
        avatarUrl: null, 
        role: 'reader', 
        bio: '', 
        genres: [], 
        followersCount: 0, 
        storiesCount: 0,
        socialLinks: { instagram: '', twitter: '', website: '' }
      }, 
      authorStories: [], 
      authorStoriesLoading: false,
      chapters: [],
      chaptersLoading: false,
      discoverData: { trendingAuthors: [], newStories: [], popularStories: [], followingStories: [] },
      followingAuthors: [],
      followingAuthorsProfiles: [],
      discoverLoading: false,
  globalSearchResults: { authors: [], stories: [] },
  isSearchingGlobal: false,
  messages: [],
  messagesLoading: false,
  // Community & social state defaults
  userWishlist: [],
  userStoryLikes: [],
  userChapterLikes: [],
  userCommentLikes: [],
  userRatings: {},
  favoriteStories: [],
  currentlyReading: [],
  finishedStories: [],
  notifications: [],
      notificationsLoading: false,
      unreadNotificationsCount: 0,
      notificationSubscription: null,
      isSidebarOpen: false,

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),



      fetchNotifications: async () => {
        const { user } = get();
        if (!user) return;

        set({ notificationsLoading: true });
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:profiles!actor_id(full_name, username, avatar_url),
              stories:stories!story_id(title),
              chapters:chapters!chapter_id(title),
              comments:comments!comment_id(content)
            `)
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) {
            // Suppress expected 401/403 logs
            if (error.status === 401 || error.status === 403) return;
            throw error;
          }
          
          const unreadCount = data ? data.filter(n => !n.is_read).length : 0;
          set({ 
            notifications: data || [], 
            unreadNotificationsCount: unreadCount,
            notificationsLoading: false 
          });
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
          set({ notificationsLoading: false });
        }
      },

      subscribeToNotifications: () => {
        const { user } = get();
        if (!user) return;
        establishResonancePresence(user.id, (payload) => {
           get().fetchNotifications();
        });
      },

      unsubscribeFromNotifications: () => {
        terminateResonancePresence();
      },

      createNotification: async (recipientId, type, details = {}) => {
        const { user } = get();
        if (!user || user.id === recipientId) return;

        try {
          // CHECK FIRST TO AVOID 409 RED CONSOLE ERROR
          // We query for an existing unread notification of the same type/actor/target
          const query = supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', recipientId)
            .eq('actor_id', user.id)
            .eq('type', type)
            .eq('is_read', false); // Only avoid duplicates if they haven't seen it yet

          if (details.storyId) query.eq('story_id', details.storyId);
          else query.is('story_id', null);
          
          if (details.chapterId) query.eq('chapter_id', details.chapterId);
          else query.is('chapter_id', null);
          
          if (details.commentId) query.eq('comment_id', details.commentId);
          else query.is('comment_id', null);

          const { data: existing } = await query.maybeSingle();
          if (existing) return;

          const notificationData = {
            recipient_id: recipientId,
            actor_id: user.id,
            type,
            story_id: details.storyId || null,
            chapter_id: details.chapterId || null,
            comment_id: details.commentId || null,
            is_read: false
          };

          const { error } = await supabase
            .from('notifications')
            .insert(notificationData);
          
          if (error && error.code !== '23505') {
             console.error('Notification creation failed:', error);
          }

          if (error && error.code !== '23505') {
            // Silently handle or categorize error for production
          }
        } catch (err) {
          console.error('Notification creation error:', err);
        }
      },

      markAllNotificationsRead: async () => {
        const { user, notifications } = get();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          if (error) throw error;

          set({
            notifications: notifications.map(n => ({ ...n, is_read: true })),
            unreadNotificationsCount: 0
          });
        } catch (err) {
          console.error('Mark all as read failed:', err);
        }
      },

      markNotificationRead: async (notificationId) => {
        const { user, notifications } = get();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('recipient_id', user.id);

          if (error) throw error;

          const updatedNotifications = notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          );
          
          set({
            notifications: updatedNotifications,
            unreadNotificationsCount: updatedNotifications.filter(n => !n.is_read).length
          });
        } catch (err) {
          console.error('Mark as read failed:', err);
        }
      },
      
      setUser: (user) => {
        const oldUser = get().user;
        
        // --- IDENTITY GUARD ---
        // If we are switching users in the same browser session, 
        // we MUST purge all previous state before syncing new data.
        if (user && oldUser && user.id !== oldUser.id) {
          console.warn('Identity change detected. Purging session data for isolation.');
          get().clearSession();
        }

        set({ user });

        if (user) {
          // Wrapped in timeout to allow state to settle
          setTimeout(() => {
            get().syncCloudData();
            get().subscribeToNotifications();
          }, 0);
        } else {
          get().unsubscribeFromNotifications();
        }
      },
      setBooks: (books) => set({ books }),
      addBook: async (book) => {
        const { user } = get();
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const { error } = await supabase.from('books').insert({
              id: book.id,
              user_id: user.id,
              title: book.title,
              author: book.author,
              file_size: book.fileSize,
              type: book.type,
              cover_url: book.coverUrl,
            });
            if (error) throw error;
          } catch (err) {
            console.error('Failed to sync book to cloud:', err);
          }
        }
        set((state) => ({ books: [...state.books, book] }));
      },
      removeBook: async (bookId) => {
        const { user } = get();
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await supabase.from('books').delete().eq('id', bookId);
          } catch (err) {
            console.error('Failed to remove book from cloud:', err);
          }
        }
        set((state) => ({ 
          books: state.books.filter(b => b.id !== bookId) 
        }))
        deleteBookFile(bookId).catch(err => console.error('Deletion failed:', err))
      },
      
      updateProgress: async (bookId, progress) => {
        const { user } = get();
        const newProgress = { ...get().readingProgress[bookId], ...progress, lastRead: new Date().toISOString() };
        
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const { error } = await supabase.from('reading_progress').upsert({
              user_id: user.id,
              book_id: bookId,
              location: newProgress.location,
              percentage: newProgress.percentage,
              last_read: newProgress.lastRead
            });
            if (error) throw error;
          } catch (err) {
            console.error('Failed to sync progress to cloud:', err);
          }
        }

        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [bookId]: newProgress
          }
        }));
      },

      addAnnotation: async (bookId, annotation) => {
        const { user } = get();
        const id = Math.random().toString(36).substr(2, 9);
        const newAnnotation = { ...annotation, id };

        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const { error } = await supabase.from('annotations').insert({
              id,
              user_id: user.id,
              book_id: bookId,
              type: annotation.type,
              text: annotation.text,
              color: annotation.color,
              note: annotation.note,
              location: annotation.location,
              rects: annotation.rects,
              style: annotation.style || 'highlight',
              timestamp: annotation.timestamp || new Date().toISOString()
            });
            if (error) {
              console.error('Supabase Annotation Insert Error:', error.message, error.details);
              throw error;
            }
          } catch (err) {
            console.error('CRITICAL: Failed to sync highlight to Supabase. Check RLS policies.', err);
          }
        }

        set((state) => ({
          annotations: {
            ...state.annotations,
            [bookId]: [...(state.annotations[bookId] || []), newAnnotation]
          }
        }));
      },

      removeAnnotation: async (bookId, annId) => {
        const { user } = get();
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await supabase.from('annotations').delete().eq('id', annId);
          } catch (err) {
            console.error('Failed to remove annotation from cloud:', err);
          }
        }
        set((state) => ({
          annotations: {
            ...state.annotations,
            [bookId]: state.annotations[bookId]?.filter(a => a.id !== annId)
          }
        }));
      },

      addBookmark: async (bookId, bookmark) => {
        const { user } = get();
        const id = Math.random().toString(36).substr(2, 9);
        const newBookmark = { ...bookmark, id };

        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const { error } = await supabase.from('bookmarks').insert({
              id,
              user_id: user.id,
              book_id: bookId,
              label: bookmark.label,
              location: bookmark.location
            });
            if (error) {
              console.error('Supabase Bookmark Insert Error:', error.message);
              throw error;
            }
          } catch (err) {
            console.error('CRITICAL: Failed to sync bookmark to Supabase.', err);
          }
        }

        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [bookId]: [...(state.bookmarks[bookId] || []), newBookmark]
          }
        }));
      },

      removeBookmark: async (bookId, bookmarkId) => {
        const { user } = get();
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await supabase.from('bookmarks').delete().eq('id', bookmarkId);
          } catch (err) {
            console.error('Failed to remove bookmark from cloud:', err);
          }
        }
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [bookId]: state.bookmarks[bookId]?.filter(b => b.id !== bookmarkId)
          }
        }));
      },

      updateReaderSettings: (settings) => set((state) => ({
        readerSettings: { ...state.readerSettings, ...settings }
      })),

      saveCustomColor: (color) => set((state) => ({
        customColors: state.customColors.includes(color) ? state.customColors : [color, ...state.customColors].slice(0, 10)
      })),

      updateUserStats: async (stats) => {
        const { user, userStats } = get();
        const newStats = { 
          totalReadingTimeMs: userStats.totalReadingTimeMs + (stats.totalReadingTimeMs || 0),
          totalPagesRead: userStats.totalPagesRead + (stats.totalPagesRead || 0)
        };

        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              total_reading_time_ms: newStats.totalReadingTimeMs,
              total_pages_read: newStats.totalPagesRead,
              updated_at: new Date().toISOString()
            });
          } catch (err) {
            console.error('Failed to sync user stats:', err);
          }
        }

        set((state) => ({ userStats: newStats }));
      },

      checkUsernameAvailability: async (username) => {
        const { user } = get();
        if (!username || username.length < 3) return true;
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', user.id) // Exclude current user
            .maybeSingle();
            
          if (error) throw error;
          return !data; // returns true if NO other user has it
        } catch (err) {
          console.error('Availability check failed:', err);
          return false;
        }
      },

      updateUserProfile: async (data) => {
        const { user } = get();
        const updated = { ...get().userProfile, ...data };
        
        // Optimistic local update
        set({ userProfile: updated });
        
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const { error } = await supabase.from('profiles').upsert({
              id: user.id,
              full_name: updated.fullName,
              username: updated.username,
              avatar_url: updated.avatarUrl,
              bio: updated.bio,
              genres: updated.genres,
              social_links: updated.socialLinks,
            }, { onConflict: 'id' });
            
            if (error) throw error;
            
            // Critical persistence fix: Force a refresh of the local state from cloud truth 
            // after a successful save to ensure no metadata desync on refresh.
            await get().refreshUserProfile();
            return true;
          } catch (err) {
            console.error('Failed to save profile:', err);
            return false;
          }
        }
        return true;
      },

      verifyCredentials: async (email, password) => {
         try {
            // We use signInWithPassword as a verification mechanism.
            // If it succeeds, the credentials are valid for the current user.
            const { error } = await supabase.auth.signInWithPassword({
               email,
               password
            });
            
            if (error) return false;
            return true;
         } catch (err) {
            console.error('Credential verification failed:', err);
            return false;
         }
      },

      becomeAuthor: async () => {
        const { user } = get();
        set((state) => ({ userProfile: { ...state.userProfile, role: 'author' } }));
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await supabase.from('profiles').upsert({ id: user.id, role: 'author' }, { onConflict: 'id' });
          } catch (err) {
            console.error('Failed to upgrade role:', err);
          }
        }
      },

      fetchAuthorStories: async () => {
        const { user } = get();
        if (!user) return;
        set({ authorStoriesLoading: true });
        try {
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('author_id', user.id)
            .order('updated_at', { ascending: false });
          
          if (error) throw error;
          
          const mapped = data.map(s => ({
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            description: s.description,
            genre: s.genre,
            coverUrl: s.cover_url,
            language: s.language,
            matureContent: s.mature_content,
            visibility: s.visibility,
            updatedAt: s.updated_at
          }));
          
          set({ authorStories: mapped });
        } catch (err) {
          console.error('Failed to fetch author stories:', err);
        } finally {
          set({ authorStoriesLoading: false });
        }
      },

      createStory: async (storyData) => {
        const { user } = get();
        if (!user) return;
        try {
          const { data, error } = await supabase
            .from('stories')
            .insert({
              author_id: user.id,
              title: storyData.title,
              subtitle: storyData.subtitle,
              description: storyData.description,
              genre: storyData.genre,
              cover_url: storyData.coverUrl,
              language: storyData.language,
              mature_content: storyData.matureContent,
              visibility: storyData.visibility,
              slug: get().generateSlug(storyData.title)
            })
            .select()
            .single();
          
          if (error) throw error;
          
          const newStory = {
            id: data.id,
            title: data.title,
            subtitle: data.subtitle,
            description: data.description,
            genre: data.genre,
            coverUrl: data.cover_url,
            language: data.language,
            matureContent: data.mature_content,
            visibility: data.visibility,
            updatedAt: data.updated_at
          };
          
          set(state => ({
            authorStories: [newStory, ...state.authorStories]
          }));
          return newStory;
        } catch (err) {
          console.error('Failed to create story:', err);
          throw err;
        }
      },

      updateStory: async (id, storyData) => {
        try {
          const { error } = await supabase
            .from('stories')
            .update({
              title: storyData.title,
              subtitle: storyData.subtitle,
              description: storyData.description,
              genre: storyData.genre,
              cover_url: storyData.coverUrl,
              language: storyData.language,
              mature_content: storyData.matureContent,
              visibility: storyData.visibility,
              slug: get().generateSlug(storyData.title),
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) throw error;
          
          set(state => ({
            authorStories: state.authorStories.map(s => 
              s.id === id ? { ...s, ...storyData, updatedAt: new Date().toISOString() } : s
            )
          }));
        } catch (err) {
          console.error('Failed to update story:', err);
          throw err;
        }
      },

      deleteStory: async (id) => {
        try {
          const { error } = await supabase.from('stories').delete().eq('id', id);
          if (error) throw error;
          set(state => ({
            authorStories: state.authorStories.filter(s => s.id !== id)
          }));
        } catch (err) {
          console.error('Failed to delete story:', err);
          throw err;
        }
      },

      fetchChapters: async (storyId) => {
        set({ chaptersLoading: true });
        try {
          const { data, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('story_id', storyId)
            .order('order_index', { ascending: true });
          
          if (error) throw error;
          
          const mapped = data.map(c => ({
            id: c.id,
            storyId: c.story_id,
            title: c.title,
            content: c.content,
            orderIndex: c.order_index,
            status: c.status,
            isFree: c.is_free,
            price: c.price,
            followersOnly: c.followers_only,
            scheduledAt: c.scheduled_at,
            updatedAt: c.updated_at
          }));
          
          set({ chapters: mapped });
        } catch (err) {
          console.error('Failed to fetch chapters:', err);
        } finally {
          set({ chaptersLoading: false });
        }
      },

      createChapter: async (storyId, title) => {
        const { user, chapters } = get();
        if (!user) return;
        
        const nextOrder = chapters.length > 0 
          ? Math.max(...chapters.map(c => c.orderIndex)) + 1 
          : 0;

        try {
          const { data, error } = await supabase
            .from('chapters')
            .insert({
              story_id: storyId,
              author_id: user.id,
              title,
              order_index: nextOrder,
              status: 'draft'
            })
            .select()
            .single();
          
          if (error) throw error;
          
          const newChapter = {
            id: data.id,
            storyId: data.story_id,
            title: data.title,
            content: data.content,
            orderIndex: data.order_index,
            status: data.status,
            isFree: data.is_free,
            price: data.price,
            followersOnly: data.followers_only,
            updatedAt: data.updated_at
          };
          
          set(state => ({
            chapters: [...state.chapters, newChapter]
          }));
          return newChapter;
        } catch (err) {
          console.error('Failed to create chapter:', err);
          throw err;
        }
      },

      updateChapter: async (id, chapterData) => {
        try {
          const { user } = get();
          const { data: existingChapter } = await supabase.from('chapters').select('status, story_id').eq('id', id).single();
          
          const { error } = await supabase
            .from('chapters')
            .update({
              title: chapterData.title,
              content: chapterData.content,
              status: chapterData.status,
              is_free: chapterData.isFree,
              price: chapterData.price,
              followers_only: chapterData.followersOnly,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) throw error;

          // If chapter is newly published, notify followers
          if (chapterData.status === 'published' && existingChapter?.status !== 'published') {
            const { data: followers } = await supabase
              .from('follows')
              .select('follower_id')
              .eq('following_id', user.id);

            if (followers) {
              for (const f of followers) {
                await get().createNotification(f.follower_id, 'new_chapter', {
                  storyId: existingChapter.story_id,
                  chapterId: id
                });
              }
            }
          }
          
          set(state => ({
            chapters: state.chapters.map(c => 
              c.id === id ? { ...c, ...chapterData, updatedAt: new Date().toISOString() } : c
            )
          }));
        } catch (err) {
          console.error('Failed to update chapter:', err);
          throw err;
        }
      },

      deleteChapter: async (id) => {
        try {
          const { error } = await supabase.from('chapters').delete().eq('id', id);
          if (error) throw error;
          set(state => ({
            chapters: state.chapters.filter(c => c.id !== id)
          }));
        } catch (err) {
          console.error('Failed to delete chapter:', err);
          throw err;
        }
      },

      saveChapterOrder: async (storyId, orderedChapters) => {
        try {
          // Local update first for UI snappy feel
          set({ chapters: orderedChapters });

          const updates = orderedChapters.map((c, i) => ({
            id: c.id,
            story_id: storyId,
            author_id: get().user.id,
            title: c.title,
            order_index: i,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase
            .from('chapters')
            .upsert(updates, { onConflict: 'id' });
          
          if (error) throw error;
        } catch (err) {
          console.error('Failed to save chapter order:', err);
          // Rollback on fail would be good here but keeping it simple for now
          get().fetchChapters(storyId);
        }
      },

      setTheme: (theme) => {
        set({ theme });
        // Persist to Supabase if logged in
        const { user } = get();
        if (user && import.meta.env.VITE_SUPABASE_URL) {
          supabase.from('profiles').update({ theme }).eq('id', user.id).then(({ error }) => {
            if (error) console.error('Failed to sync theme to cloud:', error);
          });
        }
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFileBlob: (bookId, file) => set((state) => ({
        fileBlobs: { ...state.fileBlobs, [bookId]: file }
      })),

      syncCloudData: async () => {
        const { user } = get();
        if (!user || !import.meta.env.VITE_SUPABASE_URL) return;

        // AUTH GATE: Verify actual session is valid before firing heavy sync
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
          // Fetch profile safely prioritizing explicit filters over RLS dependency
          let profile = null;
          const { data: fetchProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!fetchProfile && !profileError) {
             // ⚠️ CRITICAL: Profile missing during active session means the account was either manually purged 
             // from the dashboard or deleted via the Danger Zone. Force sign-out to prevent invalid state.
             console.warn('Profile missing for active session. Purging local state.');
             await supabase.auth.signOut();
             get().clearSession();
             window.location.href = '/auth';
             return;
          } else if (profileError) {
             throw profileError;
          } else {
             profile = fetchProfile;
          }

          // Fetch books, progress, annotations with explicit user_id filters
          const { data: books, error: booksError } = await supabase.from('books').select('*').eq('user_id', user.id);
          if (booksError) throw booksError; 
          
          const { data: progress, error: progressError } = await supabase.from('reading_progress').select('*').eq('user_id', user.id);
          if (progressError) throw progressError; 

          const { data: annotations, error: annotationsError } = await supabase.from('annotations').select('*').eq('user_id', user.id);
          if (annotationsError) throw annotationsError; 

          const { data: bookmarks, error: bookmarksError } = await supabase.from('bookmarks').select('*').eq('user_id', user.id);
          if (bookmarksError) throw bookmarksError;

          const { data: wishlist } = await supabase.from('wishlists').select('*').eq('user_id', user.id);
          const { data: storyLikes } = await supabase.from('story_likes').select('story_id').eq('user_id', user.id);
          const { data: chapLikes } = await supabase.from('chapter_likes').select('chapter_id').eq('user_id', user.id);
          const { data: commLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id);
          const { data: ratings } = await supabase.from('ratings').select('story_id, rating').eq('user_id', user.id);
          const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);

          const formattedProgress = {};
          progress.forEach(p => {
            formattedProgress[p.book_id] = { location: p.location, percentage: p.percentage, lastRead: p.last_read };
          });

          const formattedAnnotations = {};
          annotations.forEach(a => {
            if (!formattedAnnotations[a.book_id]) formattedAnnotations[a.book_id] = [];
            formattedAnnotations[a.book_id].push({
              id: String(a.id), 
              type: a.type, 
              text: a.text, 
              color: a.color, 
              note: a.note, 
              location: isNaN(a.location) ? a.location : Number(a.location),
              rects: a.rects,
              style: a.style,
              timestamp: a.timestamp
            });
          });

          const formattedBookmarks = {};
          bookmarks.forEach(b => {
            if (!formattedBookmarks[b.book_id]) formattedBookmarks[b.book_id] = [];
            formattedBookmarks[b.book_id].push({
              id: b.id, label: b.label, location: b.location
            });
          });

          const fetchCoverUrl = async (title) => {
            try {
              const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
              const data = await res.json();
              if (data.docs?.[0]?.cover_i) {
                return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
              }
            } catch (_) {}
            return null;
          };

          const mappedBooks = await Promise.all(books.map(async (b) => {
            let coverUrl = b.cover_url;
            if (!coverUrl) {
              coverUrl = await fetchCoverUrl(b.title);
              if (coverUrl) {
                supabase.from('books').update({ cover_url: coverUrl }).eq('id', b.id).then(() => {});
              }
            }
            return {
              id: b.id,
              title: b.title,
              author: b.author,
              fileSize: b.file_size,
              type: b.type,
              coverUrl,
              uploadDate: b.upload_date
            };
          }));

          set({
            books: mappedBooks,
            readingProgress: formattedProgress,
            annotations: formattedAnnotations,
            bookmarks: formattedBookmarks,
            userStats: {
              totalReadingTimeMs: Number(profile?.total_reading_time_ms || 0),
              totalPagesRead: Number(profile?.total_pages_read || 0)
            },
            userProfile: {
              ...(get().userProfile || {}),
              fullName: profile?.full_name || user?.user_metadata?.full_name || '',
              username: profile?.username || '',
              avatarUrl: profile?.avatar_url || null,
              role: profile?.role || 'reader',
              bio: profile?.bio || '',
              genres: Array.isArray(profile?.genres) ? profile.genres : [],
              followersCount: profile?.followers_count || 0,
              storiesCount: profile?.stories_count || 0,
              socialLinks: (profile?.social_links && typeof profile.social_links === 'object') 
                ? profile.social_links 
                : { instagram: '', twitter: '', website: '' },
              theme: profile?.theme || 'light',
            },
            theme: profile?.theme || 'light',
            userWishlist: wishlist || [],
            userStoryLikes: storyLikes?.map(l => l.story_id) || [],
            userChapterLikes: chapLikes?.map(l => l.chapter_id) || [],
            userCommentLikes: commLikes?.map(l => l.comment_id) || [],
            userRatings: ratings ? Object.fromEntries(ratings.map(r => [r.story_id, r.rating])) : {},
            followingAuthors: follows?.map(f => f.following_id) || [],
            favoriteStories: wishlist?.filter(w => w.category === 'favorites').map(w => w.story_id) || [],
            currentlyReading: wishlist?.filter(w => w.category === 'currently_reading').map(w => w.story_id) || [],
            finishedStories: wishlist?.filter(w => w.category === 'finished').map(w => w.story_id) || [],
          });

          // --- IDENTITY AUDIT LOG ---
          console.table({
            "Identity Key": "Session Audit",
            "Auth UID": user.id,
            "Profile ID": profile?.id,
            "Active Role": profile?.role || 'reader (default)',
            "Status": (user.id === profile?.id) ? "✅ ISOLATED" : "⚠️ MISMATCH"
          });

          // Fetch notifications and community presence after sync
          get().fetchNotifications();
          get().fetchFollowingProfiles();
          get().subscribeToNotifications(); // Start Realtime
        } catch (err) {
          console.error('Sync failed:', err);
        }
      },
      
      refreshUserProfile: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;

          // 1. Follower Count (Direct Table Query)
          const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id);

          // 2. Stories & Metrics Fetch
          const { data: stories } = await supabase
            .from('stories')
            .select('id')
            .eq('author_id', user.id);
          
          const storyIds = (stories || []).map(s => s.id);
          let totalLikes = 0;
          let totalComments = 0;
          
          if (storyIds.length > 0) {
            // Count story likes from OTHERS
            const { count: likesCount } = await supabase
              .from('story_likes')
              .select('*', { count: 'exact', head: true })
              .in('story_id', storyIds)
              .neq('user_id', user.id);
            
            // Count ALL chapter likes from OTHERS for these stories
            const { data: chapters } = await supabase
              .from('chapters')
              .select('id')
              .in('story_id', storyIds);
            
            const chapterIds = (chapters || []).map(c => c.id);
            let chapLikesCountTotal = 0;
            
            if (chapterIds.length > 0) {
               const { count: chapLikesCount } = await supabase
                 .from('chapter_likes')
                 .select('*', { count: 'exact', head: true })
                 .in('chapter_id', chapterIds)
                 .neq('user_id', user.id);
               chapLikesCountTotal = chapLikesCount || 0;
            }

            totalLikes = (likesCount || 0) + chapLikesCountTotal;

            // Count comments from OTHERS only (genuine resonance)
            const { count: commentCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .in('story_id', storyIds)
              .neq('user_id', user.id);
            totalComments = commentCount || 0;
          }
            
          if (profile) {
            // Update the local store with fresh truth
            set({
              userProfile: {
                ...(get().userProfile || {}),
                fullName: profile.full_name || '',
                username: profile.username || '',
                avatarUrl: profile.avatar_url || null,
                role: profile.role || 'reader',
                bio: profile.bio || '',
                genres: Array.isArray(profile.genres) ? profile.genres : [],
                followersCount: followersCount !== undefined ? followersCount : (profile.followers_count || 0),
                storiesCount: stories?.length || profile.stories_count || 0,
                totalLikes: totalLikes,
                totalComments: totalComments,
                socialLinks: (profile.social_links && typeof profile.social_links === 'object') 
                  ? profile.social_links 
                  : { instagram: '', twitter: '', website: '' },
              }
            });
          }
        } catch (err) {
          console.error('Profile refresh failed:', err);
        }
      },

      fetchFollowingProfiles: async () => {
        const { user, followingAuthors } = get();
        if (!user || !followingAuthors || followingAuthors.length === 0) {
          set({ followingAuthorsProfiles: [] });
          return;
        }

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', followingAuthors);

          if (error) throw error;
          set({ followingAuthorsProfiles: data || [] });
        } catch (err) {
          console.error('Fetch following profiles failed:', err);
        }
      },

      clearSession: () => {
        get().unsubscribeFromNotifications(); // Professional cleanup on logout
        set({ 
          user: null, 
          books: [], 
          currentBook: null,
          readingProgress: {}, 
          annotations: {}, 
          bookmarks: {}, 
          fileBlobs: {}, 
          userStats: { totalReadingTimeMs: 0, totalPagesRead: 0 }, 
          userProfile: { 
            fullName: '', 
            username: '', 
            avatarUrl: null, 
            role: 'reader', 
            bio: '', 
            genres: [], 
            followersCount: 0, 
            storiesCount: 0,
            socialLinks: { instagram: '', twitter: '', website: '' }
          },
          authorStories: [],
          chapters: [],
          followingAuthors: [],
          followingAuthorsProfiles: [],
          userConversations: [],
          globalSearchResults: { authors: [], stories: [] },
          messages: [],
          userWishlist: [],
          userStoryLikes: [],
          userChapterLikes: [],
          userCommentLikes: [],
          userRatings: {},
          favoriteStories: [],
          currentlyReading: [],
          finishedStories: [],
          notifications: [],
          unreadNotificationsCount: 0,
          notificationSubscription: null
        });
      },

      deleteAccount: async () => {
        const { user } = get();
        if (!user) return false;

        try {
          // 1. Delete profile and associated data 
          // Our SQL Cascades (account_deletion_fix.sql) handle purging resonance data.
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (profileError) {
            console.error('Database deletion failed:', profileError);
            throw profileError;
          }

          // 2. Clear local session & Official Auth Teardown
          get().clearSession();
          await supabase.auth.signOut();
          
          // 3. HARD REFRESH: To clear any lingering memory/state
          window.location.href = '/auth';
          return true;
        } catch (err) {
          console.error('Account deletion failed:', err);
          return false;
        }
      },

      logout: async () => {
        const state = get();
        // 1. Sync local data if using mock
        if (state.user && !import.meta.env.VITE_SUPABASE_URL) {
          mockDatabase.saveData(state.user.id, state);
        }
        
        // 2. Clear real-time resonance
        terminateResonancePresence();
        
        // 3. Purge store and local storage via clearSession
        get().clearSession();
        
        // 4. Perform official Supabase sign-out
        await supabase.auth.signOut();
        
        // 5. HARD REFRESH: Absolute security layer to reset all memory/caches
        window.location.href = '/auth';
        setTimeout(() => window.location.reload(), 100);
      },

      // --- COMMUNITY ACTIONS ---
      generateSlug: (text) => {
        return text
          .toLowerCase()
          .replace(/[^\w ]+/g, '')
          .replace(/ +/g, '-');
      },

      fetchDiscoveryData: async () => {
        set({ discoverLoading: true });
        try {
          // 1. Trending Authors (Top by followers)
          const { data: authors } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'author')
            .order('followers_count', { ascending: false })
            .limit(10);

          // 2. New Stories
          const { data: newStories } = await supabase
            .from('stories')
            .select('*, profiles(full_name, avatar_url, username)')
            .eq('visibility', 'published')
            .order('updated_at', { ascending: false })
            .limit(12);

          // 3. Following Stories (If logged in)
          let followingStories = [];
          if (get().user) {
             const { data: following } = await supabase
               .from('follows')
               .select('following_id')
               .eq('follower_id', get().user.id);
             
             const followingIds = following?.map(f => f.following_id) || [];
             
             if (followingIds.length > 0) {
                const { data: followersContent } = await supabase
                  .from('stories')
                  .select('*, profiles!user_id(full_name, avatar_url, username)')
                  .in('author_id', followingIds)
                  .eq('visibility', 'published')
                  .order('updated_at', { ascending: false })
                  .limit(10);
                followingStories = followersContent || [];
             }
          }

          set({ 
            discoverData: { 
              trendingAuthors: authors || [], 
              newStories: newStories || [], 
              followingStories 
            } 
          });
        } catch (err) {
          console.error('Discovery fetch failed:', err);
        } finally {
          set({ discoverLoading: false });
        }
      },

      fetchPublicProfile: async (username) => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, stories!author_id(*)')
            .eq('username', username)
            .maybeSingle();
          
          if (error) throw error;
          if (!profile) return null;

          // Fetch real-time total followers
          const { count: followersCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);

          // All published stories count
          const { count: storiesCount } = await supabase
             .from('stories')
             .select('*', { count: 'exact', head: true })
             .eq('author_id', profile.id)
             .eq('visibility', 'published');

          // Filter stories for published only
          const publishedStories = profile.stories?.filter(s => s.visibility === 'published') || [];
          
          return { 
            ...profile, 
            stories: publishedStories, 
            storiesCount: storiesCount || 0,
            followersCount: followersCount || 0
          };
        } catch (err) {
          console.error('Public profile fetch failed:', err);
          return null;
        }
      },

      sendMessage: async (recipientId, content) => {
        const { user } = get();
        if (!user) return false;

        try {
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              recipient_id: recipientId,
              content,
              is_read: false
            });

          if (error) throw error;
          
          // Trigger Notification
          await get().createNotification(recipientId, 'message');

          return true;
        } catch (err) {
          console.error('Send message failed:', err);
          return false;
        }
      },
      fetchConversations: async () => {
        const { user } = get();
        if (!user) return;

        try {
          // Fetch last 50 messages either sent or received
          const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(username, full_name, avatar_url), recipient:profiles!recipient_id(username, full_name, avatar_url)')
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;
          
          // Group by "conversation partner"
          const conversations = {};
          (data || []).forEach(msg => {
            const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            const partner = msg.sender_id === user.id ? msg.recipient : msg.sender;
            
            if (!conversations[partnerId]) {
              conversations[partnerId] = {
                partner,
                lastMessage: msg,
                unreadCount: 0
              };
            }
            if (!msg.is_read && msg.recipient_id === user.id) {
              conversations[partnerId].unreadCount++;
            }
          });

          set({ userConversations: Object.values(conversations) });
        } catch (err) {
          console.error('Fetch conversations failed:', err);
        }
      },

      fetchPublicStory: async (username, slug, storyId = null) => {
        try {
          let author = null;
          let story = null;

          if (storyId) {
            const { user } = get();
            const { data: storyData, error: storyError } = await supabase
              .from('stories')
              .select(`
                *,
                chapters(id, title, content, order_index, status),
                profiles!author_id(*)
              `)
              .eq('id', storyId)
              .maybeSingle();
            
            if (storyError) throw storyError;
            
            // AUTHOR PRIVILEGE: If I am the author, I don't care if it is a draft.
            // Otherwise, block if not published.
            if (storyData && storyData.visibility !== 'published' && storyData.author_id !== user?.id) {
               return null; 
            }

            if (storyData) {
              story = storyData;
              author = storyData.profiles;
            }
          } else if (username && slug) {
            const { user } = get();
            // 2. Original logic: Get author by username
            const { data: authorData } = await supabase
              .from('profiles')
              .select('id, full_name, username, avatar_url')
              .eq('username', username)
              .maybeSingle();
            
            if (authorData) {
              author = authorData;
              // 3. Get story by author and slug
              const { data: storyData, error: storyError } = await supabase
                .from('stories')
                .select('*, chapters(*)')
                .eq('author_id', author.id)
                .eq('slug', slug)
                .maybeSingle();
              
              if (storyError) throw storyError;

              // AUTHOR PRIVILEGE for Slug path
              if (storyData && storyData.visibility !== 'published' && author.id !== user?.id) {
                return null;
              }

              story = storyData;
            }
          }
          
          if (!story) return null;
          return { ...story, author };
        } catch (err) {
          console.error('Public story fetch failed:', err);
          return null;
        }
      },

      toggleFollow: async (authorId) => {
        const { user, followingAuthors } = get();
        if (!user) return;

        const isFollowing = followingAuthors.includes(authorId);

        try {
          if (isFollowing) {
            await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', authorId);
            set({ followingAuthors: followingAuthors.filter(id => id !== authorId) });
          } else {
            await supabase.from('follows').insert({
              follower_id: user.id,
              following_id: authorId
            });
            set({ followingAuthors: [...followingAuthors, authorId] });
            
            // Trigger Notification
            await get().createNotification(authorId, 'follow');
          }
          await get().refreshUserProfile();
          await get().fetchFollowingProfiles();
        } catch (err) {
          console.error('Follow toggle failed:', err);
        }
      },

      fetchInbox: async () => {
        const { user } = get();
        if (!user) return [];
        try {
           // Complex query to get most recent message per conversation
           const { data, error } = await supabase.rpc('get_inbox_threads', { user_uuid: user.id });
           if (error) throw error;
           return data || [];
        } catch (err) {
           console.error('Fetch inbox failed:', err);
           return [];
        }
      },

      fetchThread: async (otherUserId) => {
        const { user } = get();
        if (!user) return [];
        try {
           const { data, error } = await supabase
              .from('messages')
              .select('*, sender:profiles!sender_id(full_name, avatar_url, username)')
              .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
              .order('created_at', { ascending: true });
           
           if (error) throw error;
           
           // Mark as read synchronously
           await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('recipient_id', user.id)
              .eq('sender_id', otherUserId)
              .eq('is_read', false);

           return data || [];
        } catch (err) {
           console.error('Fetch thread failed:', err);
           return [];
        }
      },

      fetchMessages: async () => {
        const { user } = get();
        if (!user) return;

        set({ messagesLoading: true });
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(full_name, avatar_url, username)')
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ messages: data || [] });
        } catch (err) {
          console.error('Fetch messages failed:', err);
        } finally {
          set({ messagesLoading: false });
        }
      },

      markMessageRead: async (messageId) => {
        try {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', messageId);

          if (error) throw error;
          
          set(state => ({
            messages: state.messages.map(m => 
              m.id === messageId ? { ...m, is_read: true } : m
            )
          }));
        } catch (err) {
          console.error('Mark message read failed:', err);
        }
      },

      searchGlobal: async (query) => {
        if (!query || query.length < 2) {
          set({ globalSearchResults: { authors: [], stories: [] } });
          return;
        }

        set({ isSearchingGlobal: true });
        try {
          // Search Authors
          const { data: authors } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(5);

          // Search Published Stories
          const { data: stories } = await supabase
            .from('stories')
            .select('*, profiles(full_name, avatar_url, username)')
            .eq('visibility', 'published')
            .ilike('title', `%${query}%`)
            .limit(5);

          set({ globalSearchResults: { authors: authors || [], stories: stories || [] } });
        } catch (err) {
          console.error('Global search failed:', err);
        } finally {
          set({ isSearchingGlobal: false });
        }
      },

      // --- READER COMMUNITY ACTIONS ---

      postComment: async ({ storyId, chapterId, parentId, content }) => {
        try {
          const { user, lastActionAt } = get();
          if (!user) return null;
          
          // Anti-Spam: 5s cooldown
          if (Date.now() - (lastActionAt || 0) < 5000) {
            alert("Please wait a moment before posting again.");
            return null;
          }

          const { data, error } = await supabase
            .from('comments')
            .insert({
              user_id: user.id,
              story_id: storyId,
              chapter_id: chapterId || null,
              parent_id: parentId || null,
              content: content
            })
            .select('*, profiles!user_id(full_name, avatar_url, username)')
            .single();
          
          if (error) throw error;

          // Notification Logic
          try {
            if (commentData.parentId) {
               // Notify the user of the parent comment being replied to
               const { data: parentComm } = await supabase.from('comments').select('user_id').eq('id', commentData.parentId).single();
               if (parentComm && parentComm.user_id !== user.id) {
                 await get().createNotification(parentComm.user_id, 'reply', { 
                   storyId: commentData.storyId, 
                   chapterId: commentData.chapterId,
                   commentId: data.id 
                 });
               }
            } else {
               // Notify story author for new top-level comment
               const { data: story } = await supabase.from('stories').select('author_id').eq('id', commentData.storyId).single();
               if (story && story.author_id !== user.id) {
                 await get().createNotification(story.author_id, 'comment', { 
                   storyId: commentData.storyId, 
                   chapterId: commentData.chapterId,
                   commentId: data.id 
                 });
               }
            }
          } catch (notifErr) { console.error('Comment notification failed:', notifErr); }

          return data;
        } catch (err) {
          console.error('Post comment failed:', err);
          return null;
        }
      },

      deleteComment: async (commentId) => {
        try {
          const res = await supabase.from('comments').update({ is_deleted: true, content: '[Comment removed by moderator]' }).eq('id', commentId);
          return !res.error;
        } catch (e) { return false; }
      },

      reportContent: async ({ targetType, targetId, reason, details }) => {
        try {
          const { user } = get();
          if (!user) return false;
          const { error } = await supabase.from('reports').insert({
            reporter_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reason,
            details
          });
          return !error;
        } catch (e) { return false; }
      },

      toggleCommentLike: async (commentId) => {
        const { user, userCommentLikes } = get();
        if (!user) return;
        const isLiked = userCommentLikes.includes(commentId);
        try {
          if (isLiked) {
            await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
            set({ userCommentLikes: userCommentLikes.filter(id => id !== commentId) });
          } else {
            await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId });
            set({ userCommentLikes: [...userCommentLikes, commentId] });
          }
        } catch (err) {
          console.error('Toggle comment like failed:', err);
        }
      },

      toggleStoryLike: async (storyId) => {
        const { user, userStoryLikes } = get();
        if (!user) return;
        const isLiked = userStoryLikes.includes(storyId);
        try {
          if (isLiked) {
            await supabase.from('story_likes').delete().eq('user_id', user.id).eq('story_id', storyId);
            set({ userStoryLikes: userStoryLikes.filter(id => id !== storyId) });
          } else {
            await supabase.from('story_likes').insert({ user_id: user.id, story_id: storyId });
            set({ userStoryLikes: [...userStoryLikes, storyId] });
            
            // Trigger Notification
            const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
            if (story && story.author_id !== user.id) {
              await get().createNotification(story.author_id, 'like_story', { storyId });
            }
          }

          // Refresh metrics for immediate visual feedback
          await get().refreshUserProfile();
        } catch (err) {
          console.error('Toggle story like failed:', err);
        }
      },

      toggleChapterLike: async (chapterId) => {
        const { user, userChapterLikes } = get();
        if (!user) return;
        const isLiked = userChapterLikes.includes(chapterId);
        try {
          if (isLiked) {
            await supabase.from('chapter_likes').delete().eq('user_id', user.id).eq('chapter_id', chapterId);
            set({ userChapterLikes: userChapterLikes.filter(id => id !== chapterId) });
          } else {
            await supabase.from('chapter_likes').insert({ user_id: user.id, chapter_id: chapterId });
            set({ userChapterLikes: [...userChapterLikes, chapterId] });
            
            // Trigger Notification
            const { data: chapter } = await supabase.from('chapters').select('story_id, stories(author_id)').eq('id', chapterId).single();
            if (chapter && chapter.stories.author_id !== user.id) {
              await get().createNotification(chapter.stories.author_id, 'like_chapter', { storyId: chapter.story_id, chapterId });
            }
          }
        } catch (err) {
          console.error('Toggle chapter like failed:', err);
        }
      },

      submitRating: async (storyId, rating) => {
        const { user, userRatings } = get();
        if (!user) return;
        try {
          const { error } = await supabase
            .from('ratings')
            .upsert({ user_id: user.id, story_id: storyId, rating, updated_at: new Date().toISOString() });
          
          if (error) throw error;
          set({ userRatings: { ...userRatings, [storyId]: rating } });

          // Trigger Notification
          const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
          if (story && story.author_id !== user.id) {
            await get().createNotification(story.author_id, 'rating', { storyId });
          }
        } catch (err) {
          console.error('Submit rating failed:', err);
        }
      },

      toggleWishlist: async (storyId, category) => {
        const { user, userWishlist } = get();
        if (!user) return;
        const existing = userWishlist.find(w => w.story_id === storyId && w.category === category);
        try {
          if (existing) {
            await supabase.from('wishlists').delete().eq('user_id', user.id).eq('story_id', storyId).eq('category', category);
            const newList = userWishlist.filter(w => !(w.story_id === storyId && w.category === category));
            set({ 
              userWishlist: newList,
              favoriteStories: newList.filter(w => w.category === 'favorites').map(w => w.story_id),
              currentlyReading: newList.filter(w => w.category === 'currently_reading').map(w => w.story_id),
              finishedStories: newList.filter(w => w.category === 'finished').map(w => w.story_id),
            });
          } else {
            // Special rule: if moving to finished, remove from currently_reading
            if (category === 'finished') {
              await supabase.from('wishlists').delete().eq('user_id', user.id).eq('story_id', storyId).eq('category', 'currently_reading');
            }
            // Special rule: if starting to read, remove from read_later
            if (category === 'currently_reading') {
              await supabase.from('wishlists').delete().eq('user_id', user.id).eq('story_id', storyId).eq('category', 'read_later');
            }

            const { error } = await supabase.from('wishlists').upsert(
              { user_id: user.id, story_id: storyId, category },
              { onConflict: 'user_id,story_id,category' }
            );
            
            if (error && error.code !== '23505') { // Ignore duplicate key errors if they still leak through
              console.error('Library sync failed:', error);
              return;
            }
            
            // Trigger Notification for Favorites
            if (category === 'favorites') {
              const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
              if (story && story.author_id !== user.id) {
                await get().createNotification(story.author_id, 'favorite', { storyId });
              }
            }

            let newList = [...userWishlist, { story_id: storyId, category }];
            if (category === 'finished') {
              newList = newList.filter(w => !(w.story_id === storyId && w.category === 'currently_reading'));
            }
            if (category === 'currently_reading') {
              newList = newList.filter(w => !(w.story_id === storyId && w.category === 'read_later'));
            }

            set({ 
              userWishlist: newList,
              favoriteStories: newList.filter(w => w.category === 'favorites').map(w => w.story_id),
              currentlyReading: newList.filter(w => w.category === 'currently_reading').map(w => w.story_id),
              finishedStories: newList.filter(w => w.category === 'finished').map(w => w.story_id),
            });
          }
        } catch (err) {
          console.error('Toggle wishlist failed:', err);
        }
      },

      fetchComments: async (storyId, chapterId = null) => {
        try {
          let query = supabase
            .from('comments')
            .select('*, profiles!user_id(full_name, avatar_url, username)')
            .eq('story_id', storyId)
            .order('created_at', { ascending: false });
          
          if (chapterId) {
            query = query.eq('chapter_id', chapterId);
          } else {
            query = query.is('chapter_id', null);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        } catch (err) {
          console.error('Fetch comments failed:', err);
          return [];
        }
      },
    }),
    {
      name: 'bookvault-storage',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => ![
          'fileBlobs', 
          'discoverData', 
          'globalSearchResults', 
          'isSearchingGlobal', 
          'discoverLoading', 
          'messages', 
          'messagesLoading', 
          'userWishlist', 
          'userStoryLikes', 
          'userChapterLikes', 
          'userCommentLikes', 
          'userRatings',
          'notificationSubscription', // DO NOT PERSIST REALTIME SUBSCRIPTION
          'notifications',
          'unreadNotificationsCount'
        ].includes(key))
      ),
    }
  )
)
