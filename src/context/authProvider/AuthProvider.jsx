import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

// Mock Firebase Auth for development/testing
let auth = null;

try {
  const app = require("context/firebase/firebase.config").default;
  auth = require("firebase/auth").getAuth(app);
} catch (error) {
  console.log("Firebase not initialized, using mock auth");
  auth = null;
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock user database for development
  const mockUsers = new Map();

  const createUser = (email, password, displayName = "") => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          // Mock implementation
          if (mockUsers.has(email)) {
            setLoading(false);
            reject({ message: "Email already in use" });
          } else {
            const mockUser = {
              uid: `mock_${Date.now()}`,
              email,
              displayName: displayName || "",
            };
            mockUsers.set(email, { ...mockUser, password });
            setUser(mockUser);
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
          const user = mockUsers.get(email);
          if (user && user.password === password) {
            const { password, ...userWithoutPassword } = user;
            setUser(userWithoutPassword);
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
            console.log("user observing");
            setUser(currentUser);
            setLoading(false);
          }
        );
        return () => unsubscribe();
      } catch (error) {
        setLoading(false);
      }
    } else {
      // Mock implementation - simulate loading
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
