import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { apiJson } from "lib/apiClient";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('realEstateUser');
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiJson("/me", { method: "GET" });
        const backendUser = data?.user || null;
        const normalizedUser = backendUser
          ? { ...backendUser, uid: backendUser.uid || backendUser.email }
          : null;
        localStorage.setItem("realEstateUser", JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("realEstateUser");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const createUser = async (email, password, displayName = "") => {
    setLoading(true);
    try {
      const data = await apiJson("/register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const normalizedUser = data?.user
        ? { ...data.user, uid: data.user.uid || data.user.email }
        : null;
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("realEstateUser", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      toast.success('Registration successful!');
      return normalizedUser;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiJson("/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const normalizedUser = data?.user
        ? { ...data.user, uid: data.user.uid || data.user.email }
        : null;
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("realEstateUser", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      toast.success('Login successful!');
      return normalizedUser;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('realEstateUser');
    setUser(null);
    toast.success('Logged out successfully!');
  };

  const providerLogin = async () => {
    throw new Error("Social login is not configured for this app.");
  };

  const updateUser = async () => {
    return;
  };

  const value = {
    user,
    loading,
    createUser,
    signIn,
    logOut,
    providerLogin,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
