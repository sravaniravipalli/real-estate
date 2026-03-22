import { AuthContext } from "context/authProvider/AuthProvider";
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "ui/loading/Loading";

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);

  let hasToken = false;
  try {
    hasToken = Boolean(localStorage.getItem("accessToken"));
  } catch {
    hasToken = false;
  }

  if (loading) {
    return <Loading />
  }

  if (user || hasToken) {
    return children;
  }

  return <Navigate to="/login" state={{ from: location }} replace></Navigate>;
}
