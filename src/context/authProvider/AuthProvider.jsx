import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

let auth = null;

try {
  const app = require("context/firebase/firebase.config").default;
  auth = require("firebase/auth").getAuth(app);
} catch (error) {
  auth = null;
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('realEstateUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

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
    } catch (error) {}
  };

  const createUser = (email, password, displayName = "") => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          const users = getMockUsers();
          if (users.has(email)) {
            setLoading(false);
            reject({ message: "Email already in use" });
          } else {
            const mockUser = { uid: mock_, email, displayName: displayName || "" };
            users.set(email, { ...mockUser, password });
            saveMockUsers(users);
            setUser(mockUser);
            localStorage.setItem('realEstateUser', JSON.stringify(mockUser));
            setLoading(false);
            resolve({ user: mockUser });
          }
        } else {
          require("firebase/auth").createUserWithEmailAndPassword(auth, email, password)
            .then((r) => { setLoading(false); resolve(r); })
            .catch((e) => { setLoading(false); reject(e); });
        }
      } catch (error) { setLoading(false); reject(error); }
    });
  };

  const signIn = (email, password) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          const users = getMockUsers();
          const u = users.get(email);
          if (u && u.password === password) {
            const { password: _pw, ...userWithoutPassword } = u;
            setUser(userWithoutPassword);
            localStorage.setItem('realEstateUser', JSON.stringify(userWithoutPassword));
            setLoading(false);
            resolve({ user: userWithoutPassword });
          } else {
            setLoading(false);
            reject({ message: "Invalid email or password" });
          }
        } else {
          require("firebase/auth").signInWithEmailAndPassword(auth, email, password)
            .then((r) => { setLoading(false); resolve(r); })
            .catch((e) => { setLoading(false); reject(e); });
        }
      } catch (error) { setLoading(false); reject(error); }
    });
  };

  const updateUser = (userInfo) => {
    return new Promise((resolve, reject) => {
      try {
        if (!auth) { setTimeout(() => resolve({}), 100); }
        else { require("firebase/auth").updateProfile(auth.currentUser, userInfo).then(resolve).catch(reject); }
      } catch (error) { reject(error); }
    });
  };

  const providerLogin = (provider) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          const mockUser = { uid: mock_, email: user_@example.com, displayName: "Test User" };
          setUser(mockUser);
          localStorage.setItem('realEstateUser', JSON.stringify(mockUser));
          setLoading(false);
          setTimeout(() => resolve({ user: mockUser }), 500);
        } else {
          require("firebase/auth").signInWithPopup(auth, provider)
            .then((r) => { setLoading(false); resolve(r); })
            .catch((e) => { setLoading(false); reject(e); });
        }
      } catch (error) { setLoading(false); reject(error); }
    });
  };

  const logOut = () => {
    toast.success("Logout Successful");
    return new Promise((resolve, reject) => {
      try {
        if (!auth) {
          setUser(null);
          localStorage.removeItem('realEstateUser');
          setLoading(false);
          setTimeout(() => resolve({}), 100);
        } else {
          require("firebase/auth").signOut(auth)
            .then((r) => { setLoading(false); resolve(r); })
            .catch((e) => { setLoading(false); reject(e); });
        }
      } catch (error) { setLoading(false); reject(error); }
    });
  };

  useEffect(() => {
    if (auth) {
      try {
        const unsubscribe = require("firebase/auth").onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          if (currentUser) { localStorage.setItem('realEstateUser', JSON.stringify(currentUser)); }
          else { localStorage.removeItem('realEstateUser'); }
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) { setLoading(false); }
    } else {
      const savedUser = localStorage.getItem('realEstateUser');
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); }
        catch (error) { localStorage.removeItem('realEstateUser'); }
      }
      setLoading(false);
    }
  }, []);

  const authInfo = { createUser, signIn, user, updateUser, logOut, providerLogin, loading, setLoading };

  return <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
