
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [therapist, setTherapist] = useState(() =>
    JSON.parse(localStorage.getItem("unfazedTherapist") || "null")
  );

  const [client, setClient] = useState(() =>
    JSON.parse(localStorage.getItem("unfazedClient") || "null")
  );

  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("unfazedUserRole") || null
  );

  const [token, setToken] = useState(
    () => localStorage.getItem("unfazedToken")
  );

  const [loading, setLoading] = useState(true);

  const saveSession = (data, role) => {
    localStorage.setItem("unfazedToken", data.token);
    localStorage.setItem("unfazedUserRole", role);

    setToken(data.token);
    setUserRole(role);

    if (role === "therapist") {
      localStorage.setItem(
        "unfazedTherapist",
        JSON.stringify(data.therapist)
      );
      localStorage.removeItem("unfazedClient");

      setTherapist(data.therapist);
      setClient(null);
    } else {
      localStorage.setItem(
        "unfazedClient",
        JSON.stringify(data.client)
      );
      localStorage.removeItem("unfazedTherapist");

      setClient(data.client);
      setTherapist(null);
    }

    return data;
  };

  useEffect(() => {
    const verifySession = async () => {
      if (!token || !userRole) {
        setLoading(false);
        return;
      }

      try {
        if (userRole === "therapist") {
          const { data } = await axiosInstance.get("/auth/me");
          const user = data.therapist || data;

          setTherapist(user);
          localStorage.setItem(
            "unfazedTherapist",
            JSON.stringify(user)
          );
        } else if (userRole === "client") {
          const { data } = await axiosInstance.get("/auth/client/me");
          const user = data.client || data;

          setClient(user);
          localStorage.setItem(
            "unfazedClient",
            JSON.stringify(user)
          );
        } else {
          throw new Error("Invalid account role");
        }
      } catch (error) {
        localStorage.removeItem("unfazedToken");
        localStorage.removeItem("unfazedUserRole");
        localStorage.removeItem("unfazedTherapist");
        localStorage.removeItem("unfazedClient");

        setToken(null);
        setUserRole(null);
        setTherapist(null);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Therapist authentication
  const login = async (email, password) => {
    const { data } = await axiosInstance.post("/auth/login", {
      email,
      password
    });

    return saveSession(data, "therapist");
  };

  const register = async (form) => {
    const { data } = await axiosInstance.post("/auth/register", form);

    return saveSession(data, "therapist");
  };

  // Client authentication
  const loginClient = async (email, password) => {
    const { data } = await axiosInstance.post(
      "/auth/client/login",
      { email, password }
    );

    return saveSession(data, "client");
  };

  const registerClient = async (form) => {
    const { data } = await axiosInstance.post(
      "/auth/client/register",
      form
    );

    return saveSession(data, "client");
  };

  const updateTherapist = (updatedData) => {
    const updated = {
      ...therapist,
      ...updatedData
    };

    setTherapist(updated);

    localStorage.setItem(
      "unfazedTherapist",
      JSON.stringify(updated)
    );
  };

  const updateClient = (updatedData) => {
  const updated = {
    ...client,
    ...updatedData
  };

  setClient(updated);

  localStorage.setItem(
    "unfazedClient",
    JSON.stringify(updated)
  );
};

  const logout = () => {
    localStorage.removeItem("unfazedToken");
    localStorage.removeItem("unfazedUserRole");
    localStorage.removeItem("unfazedTherapist");
    localStorage.removeItem("unfazedClient");

    setToken(null);
    setUserRole(null);
    setTherapist(null);
    setClient(null);
  };

  return (
    <AuthContext.Provider
      value={{
        therapist,
        client,
        token,
        userRole,
        loading,

        login,
        register,
        loginClient,
        registerClient,

        logout,
        updateTherapist,
        updateClient,

        isAuthenticated: Boolean(token && userRole),
        isTherapist: Boolean(token && userRole === "therapist"),
        isClient: Boolean(token && userRole === "client")
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
