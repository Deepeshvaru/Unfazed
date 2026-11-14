import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

function useEntitlement() {
  const { therapist } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSubscription = useCallback(async () => {
    if (!therapist) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data } = await axiosInstance.get("/subscriptions/me");
      setSubscription(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load subscription details."
      );
    } finally {
      setLoading(false);
    }
  }, [therapist?._id]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const plan = subscription?.subscriptionTier || "free";
  const planConfig = subscription?.plan || null;

  const hasFeature = (feature) => {
    return planConfig?.features?.includes(feature) || false;
  };

  return {
    plan,
    planConfig,
    hasFeature,
    loading,
    error,
    refreshSubscription
  };
}

export default useEntitlement;