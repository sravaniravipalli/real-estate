import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

// Mock Firebase Auth for development/testing
let auth = null;

try {
  const app = require("context/firebase/firebase.config").default;
  auth = require("firebase/auth").getAuth(app);
} catch (error) {
  // Firebase not initialized, using mock auth for development
  auth = null;
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user from localStorage
    try {
      const savedUser = localStorage.getItem('realEstateUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Mock user database for development (store in localStorage)
  const getMockUsers = () => {
    try {
      const saved = localStorage.getItem('mockUsersDB');
      return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch (error) {
      return new Map();
    }
  };

  const saveMockUsers = (users) => {
    try {
      localStorage.setItem('mockUsersDB', JSON.stringify([...users]));
    } catch (error) {
      console.error('Error saving mock users:', error);
    }
  };

  const mockUsers = getMockUsers();

  const createUser = (email, password, displayName = "") => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation
          const users = getMockUsers();
          if (users.has(email)) {
            setLoading(false);
            reject({ message: "Email already in use" });
          } else {
            const mockUser = {
              uid: `mock_${Date.now()}`,
              email,
              displayName: displayName || "",
            };
            users.set(email, { ...mockUser, password });
            saveMockUsers(users);
            setUser(mockUser);
            // Save user to localStorage
            localStorage.setItem('realEstateUser', JSON.stringify(mockUser));
            setLoading(false);
            resolve({ user: mockUser });
          }
        } else {
          // Real Firebase implementation
          require("firebase/auth")
            .createUserWithEmailAndPassword(auth, email, password)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const signIn = (email, password) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation
          const users = getMockUsers();
          const user = users.get(email);
          if (user && user.password === password) {
            const { password, ...userWithoutPassword } = user;
            setUser(userWithoutPassword);
            // Save user to localStorage
            localStorage.setItem('realEstateUser', JSON.stringify(userWithoutPassword));
            setLoading(false);
            resolve({ user: userWithoutPassword });
          } else {
            setLoading(false);
            reject({ message: "Invalid email or password" });
          }
        } else {
          // Real Firebase implementation
          require("firebase/auth")
            .signInWithEmailAndPassword(auth, email, password)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const updateUser = (userInfo) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation
          setTimeout(() => resolve({}), 100);
        } else {
          // Real Firebase implementation
          require("firebase/auth")
            .updateProfile(auth.currentUser, userInfo)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const providerLogin = (provider) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation for Google/Github login
          const mockUser = {
            uid: `mock_${Date.now()}`,
            email: `user_${Date.now()}@example.com`,
            displayName: "Test User",
          };
          setUser(mockUser);
          // Save user to localStorage
          localStorage.setItem('realEstateUser', JSON.stringify(mockUser));
          setTimeout(() => resolve({ user: mockUser }), 500);
        } else {
          // Real Firebase implementation
          require("firebase/auth")
            .signInWithPopup(auth, provider)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const logOut = () => {
    setLoading(true);
    toast.success("Logout Successful");
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation
          setUser(null);
          // Clear user from localStorage
          localStorage.removeItem('realEstateUser');
          setTimeout(() => resolve({}), 100);
        } else {
          // Real Firebase implementation
          require("firebase/auth")
            .signOut(auth)
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Auth state observer
  useEffect(() => {
    if (auth) {
      // Real Firebase observer
      try {
        const unsubscribe = require("firebase/auth").onAuthStateChanged(
          auth,
          (currentUser) => {
            setUser(currentUser);
            // Save user to localStorage for persistence
            if (currentUser) {
              localStorage.setItem('realEstateUser', JSON.stringify(currentUser));
            } else {
              localStorage.removeItem('realEstateUser');
            }
            setLoading(false);
          }
        );
        return () => unsubscribe();
      } catch (error) {
        setLoading(false);
      }
    } else {
      // Mock implementation - check localStorage for existing session
      const savedUser = localStorage.getItem('realEstateUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('realEstateUser');
        }
      }
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  const authInfo = {
    createUser,
    signIn,
    user,
    updateUser,
    logOut,
    providerLogin,
    loading,
    setLoading,
  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
