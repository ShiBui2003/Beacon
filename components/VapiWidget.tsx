"use client";

import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@/contexts/auth-context";

interface VapiVoiceButtonProps {
    apiKey: string;
    assistantId: string;
    config?: {
        variables?: Record<string, unknown>;
        [key: string]: unknown;
    };
    lat?: number;
    lng?: number;
    className?: string;
    style?: React.CSSProperties;
}

const VapiVoiceButton: React.FC<VapiVoiceButtonProps> = ({
    apiKey,
    assistantId,
    config = {},
    lat: latProp,
    lng: lngProp,
    className,
    style,
}) => {
    const [vapi, setVapi] = useState<Vapi | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
        lat: latProp,
        lng: lngProp,
    });
    const { user } = useAuth();

    useEffect(() => {
        const vapiInstance = new Vapi(apiKey);
        setVapi(vapiInstance);

        vapiInstance.on("call-start", () => {
            setIsConnected(true);
            setIsLoading(false);
        });

        vapiInstance.on("call-end", () => {
            setIsConnected(false);
            setIsSpeaking(false);
            setIsLoading(false);
        });

        vapiInstance.on("speech-start", () => {
            setIsSpeaking(true);
        });

        vapiInstance.on("speech-end", () => {
            setIsSpeaking(false);
        });

        vapiInstance.on("error", (error) => {
            console.error("Vapi error:", error);
            setIsLoading(false);
        });

        return () => {
            vapiInstance?.stop();
        };
    }, [apiKey]);

    useEffect(() => {
        if (typeof latProp === "number" || typeof lngProp === "number") {
            setCoords({ lat: latProp, lng: lngProp });
            return;
        }

        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                () => {
                    // Silently handle geolocation errors
                },
                {
                    enableHighAccuracy: false,
                    maximumAge: 60_000,
                    timeout: 5_000,
                }
            );
        }
    }, [latProp, lngProp]);

    const handleVoiceToggle = async () => {
        if (!user) {
            console.warn("Vapi: cannot start a voice report while signed out.");
            return;
        }
        if (!vapi) return;

        if (isConnected) {
            // End the call
            vapi.stop();
        } else {
            // Start the call
            setIsLoading(true);

            try {
                let finalLat = coords.lat ?? 0;
                let finalLng = coords.lng ?? 0;

                // Try to get fresh geolocation if needed
                if (
                    (finalLat === 0 || finalLng === 0) &&
                    typeof window !== "undefined" &&
                    "geolocation" in navigator
                ) {
                    try {
                        const position = await new Promise<GeolocationPosition>(
                            (resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(
                                    resolve,
                                    reject,
                                    {
                                        enableHighAccuracy: false,
                                        maximumAge: 60_000,
                                        timeout: 5_000,
                                    }
                                );
                            }
                        );
                        finalLat = position.coords.latitude;
                        finalLng = position.coords.longitude;
                        setCoords({ lat: finalLat, lng: finalLng });
                    } catch {
                        // Use fallback coordinates
                    }
                }

                const extraVars = config?.variables ?? {};
                const variables = {
                    ...extraVars,
                    lat: finalLat,
                    lng: finalLng,
                    userId: user?.id ?? null,
                };

                // Start the call with variables
                try {
                    await vapi.start(assistantId, {
                        variableValues: variables
                    });
                } catch (e) {
                    // Fallback: try without variables
                    console.warn("Starting call without variables:", e);
                    await vapi.start(assistantId);
                }
            } catch (error) {
                console.error("Failed to start call:", error);
                setIsLoading(false);
            }
        }
    };

    const getButtonState = () => {
        if (isLoading) {
            return {
                icon: (
                    <div
                        style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid rgba(255,255,255,0.3)",
                            borderTop: "3px solid #fff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    />
                ),
                bg: "#6b7280",
                label: "Connecting...",
            };
        }

        if (isConnected) {
            if (isSpeaking) {
                return {
                    icon: (
                        <div
                            style={{
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                    ),
                    bg: "#ef4444",
                    label: "Assistant is speaking...",
                };
            } else {
                return {
                    icon: (
                        <div
                            style={{
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                            }}
                        >
                            <div
                                style={{
                                    width: "4px",
                                    height: "16px",
                                    background: "#fff",
                                    borderRadius: "2px",
                                    marginRight: "2px",
                                    animation: "wave 1.5s ease-in-out infinite",
                                }}
                            />
                            <div
                                style={{
                                    width: "4px",
                                    height: "20px",
                                    background: "#fff",
                                    borderRadius: "2px",
                                    marginRight: "2px",
                                    animation: "wave 1.5s ease-in-out infinite 0.1s",
                                }}
                            />
                            <div
                                style={{
                                    width: "4px",
                                    height: "12px",
                                    background: "#fff",
                                    borderRadius: "2px",
                                    marginRight: "2px",
                                    animation: "wave 1.5s ease-in-out infinite 0.2s",
                                }}
                            />
                            <div
                                style={{
                                    width: "4px",
                                    height: "18px",
                                    background: "#fff",
                                    borderRadius: "2px",
                                    animation: "wave 1.5s ease-in-out infinite 0.3s",
                                }}
                            />
                        </div>
                    ),
                    bg: "#10b981",
                    label: "Listening... Click to end",
                };
            }
        }

        return {
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            ),
            bg: "#2563eb",
            label: "Click to start voice chat",
        };
    };

    const buttonState = getButtonState();

    return (
        <>
            <button
                onClick={handleVoiceToggle}
                disabled={isLoading}
                className={className}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "none",
                    background: buttonState.bg,
                    color: "#fff",
                    cursor: isLoading ? "default" : "pointer",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    outline: "none",
                    transform: isConnected && !isSpeaking ? "scale(1.1)" : "scale(1)",
                    ...style,
                }}
                onMouseOver={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = isConnected && !isSpeaking 
                            ? "scale(1.15) translateY(-2px)" 
                            : "scale(1.05) translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.2)";
                    }
                }}
                onMouseOut={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.transform = isConnected && !isSpeaking 
                            ? "scale(1.1) translateY(0)" 
                            : "scale(1) translateY(0)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
                    }
                }}
                title={buttonState.label}
            >
                {buttonState.icon}
            </button>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes wave {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.5); }
                }
            `}</style>
        </>
    );
};

export default VapiVoiceButton;
