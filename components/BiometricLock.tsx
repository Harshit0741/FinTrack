import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    AppStateStatus,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BIOMETRIC_KEY = "biometricLock";

// Don't re-lock for tiny background/active transitions.
// Camera, microphone and permission dialogs can cause these.
const BACKGROUND_LOCK_DELAY = 3000;

export function BiometricLock({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const isAuthenticating = useRef(false);
  const hasAuthenticated = useRef(false);

  const backgroundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authenticate = useCallback(async () => {
    // Prevent multiple biometric prompts at the same time.
    if (isAuthenticating.current) return;

    const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);

    if (enabled !== "true") {
      hasAuthenticated.current = true;
      setIsLocked(false);
      setLoading(false);
      return;
    }

    // Already authenticated during this app session.
    if (hasAuthenticated.current) {
      setIsLocked(false);
      setLoading(false);
      return;
    }

    isAuthenticating.current = true;
    setIsLocked(true);
    setLoading(false);

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        hasAuthenticated.current = true;
        setIsLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock FinTrack",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (result.success) {
        hasAuthenticated.current = true;
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  // Initial authentication.
  useEffect(() => {
    authenticate();
  }, [authenticate]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        // App went to background.
        if (nextAppState === "background") {
          // Start a timer instead of immediately locking.
          if (backgroundTimer.current) {
            clearTimeout(backgroundTimer.current);
          }

          backgroundTimer.current = setTimeout(() => {
            hasAuthenticated.current = false;
          }, BACKGROUND_LOCK_DELAY);

          return;
        }

        // App became active again.
        if (nextAppState === "active") {
          /*
           * Cancel the timer if the app returned quickly.
           *
           * This is important for:
           * - Camera
           * - Scanner
           * - Microphone
           * - Permission dialogs
           * - Native Android UI
           */
          if (backgroundTimer.current) {
            clearTimeout(backgroundTimer.current);
            backgroundTimer.current = null;
          }

          /*
           * Only authenticate if the timer already expired.
           *
           * If hasAuthenticated is still true, this was only
           * a temporary native UI transition.
           */
          if (!hasAuthenticated.current) {
            setTimeout(() => {
              authenticate();
            }, 300);
          }
        }
      },
    );

    return () => {
      subscription.remove();

      if (backgroundTimer.current) {
        clearTimeout(backgroundTimer.current);
        backgroundTimer.current = null;
      }
    };
  }, [authenticate]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-body">
        <ActivityIndicator />
      </View>
    );
  }

  if (isLocked) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-body px-6">
        <Text className="text-brand-bg text-xl font-semibold">
          FinTrack is locked
        </Text>

        <Text className="text-brand-text-muted text-center mt-2">
          Authenticate to continue
        </Text>

        <TouchableOpacity
          onPress={authenticate}
          className="mt-6 bg-brand-bg px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
