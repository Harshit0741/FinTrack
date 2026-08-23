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

export function BiometricLock({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const appState = useRef<AppStateStatus>(AppState.currentState);
    const isAuthenticating = useRef(false);
    const hasAuthenticated = useRef(false);

    // Tracks whether the app REALLY went into background
    const wentToBackground = useRef(false);

    const authenticate = useCallback(async () => {
        if (isAuthenticating.current) return;

        const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);

        if (enabled !== "true") {
            hasAuthenticated.current = true;
            setIsLocked(false);
            setLoading(false);
            return;
        }

        if (hasAuthenticated.current) {
            setIsLocked(false);
            setLoading(false);
            return;
        }

        isAuthenticating.current = true;
        setIsLocked(true);
        setLoading(false);

        try {
            const compatible =
                await LocalAuthentication.hasHardwareAsync();

            const enrolled =
                await LocalAuthentication.isEnrolledAsync();

            if (!compatible || !enrolled) {
                return;
            }

            const result =
                await LocalAuthentication.authenticateAsync({
                    promptMessage: "Unlock FinTrack",
                    cancelLabel: "Cancel",
                    disableDeviceFallback: false,
                });

            if (result.success) {
                hasAuthenticated.current = true;
                setIsLocked(false);
            }
        } catch (error) {
            console.error(
                "Biometric authentication error:",
                error
            );
        } finally {
            isAuthenticating.current = false;
        }
    }, []);

    // First app load
    useEffect(() => {
        authenticate();
    }, [authenticate]);

    // Lock only after the app ACTUALLY enters background
    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            (nextAppState: AppStateStatus) => {
                // App genuinely left
                if (nextAppState === "background") {
                    wentToBackground.current = true;
                }

                // Only ask again if it really went to background
                if (
                    nextAppState === "active" &&
                    wentToBackground.current
                ) {
                    wentToBackground.current = false;
                    hasAuthenticated.current = false;

                    // Small delay prevents conflict with app resume
                    setTimeout(() => {
                        authenticate();
                    }, 300);
                }

                appState.current = nextAppState;
            }
        );

        return () => subscription.remove();
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
                    <Text className="text-white font-semibold">
                        Unlock
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <>{children}</>;
}