// Local Mock Database for simulating complete authentication flows without a backend.
export const mockDatabase = {
  getUsers: () => JSON.parse(localStorage.getItem('bv_accounts') || '{}'),
  saveUsers: (u) => localStorage.setItem('bv_accounts', JSON.stringify(u)),
  
  signUp: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const accounts = mockDatabase.getUsers();
        if (accounts[email]) {
          return reject(new Error('User already registered. Please log in.'));
        }
        if (password.length < 6) return reject(new Error('Password must be at least 6 characters.'));
        
        accounts[email] = {
          id: `usr_${Math.random().toString(36).substr(2, 9)}`,
          email,
          password // (In a real app, this is hashed. This is a local mock.)
        };
        mockDatabase.saveUsers(accounts);
        
        // Initialize empty storage for this user
        localStorage.setItem(`bv_data_${accounts[email].id}`, JSON.stringify({ state: { books: [], annotations: {}, bookmarks: {}, readingProgress: {}, userStats: { totalReadingTimeMs: 0, totalPagesRead: 0 } } }));
        
        resolve({ user: { id: accounts[email].id, email } });
      }, 500);
    });
  },

  signIn: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const accounts = mockDatabase.getUsers();
        if (!accounts[email]) {
          return reject(new Error('Invalid login credentials'));
        }
        if (accounts[email].password !== password) {
          return reject(new Error('Invalid login credentials'));
        }
        resolve({ user: { id: accounts[email].id, email } });
      }, 500);
    });
  },

  loadData: (userId) => {
    const data = localStorage.getItem(`bv_data_${userId}`);
    return data ? JSON.parse(data).state : null;
  },

  saveData: (userId, state) => {
    if (!userId) return;
    localStorage.setItem(`bv_data_${userId}`, JSON.stringify({ state }));
  }
};
