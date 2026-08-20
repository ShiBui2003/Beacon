"use client";

import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { Mic, X, Loader2 } from "lucide-react";

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
    const [panelOpen, setPanelOpen] = useState(false);
    const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
        lat: latProp,
        lng: lngProp,
    });

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
            setPanelOpen(false);
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

    const startCall = async () => {
        if (!vapi || isLoading || isConnected) return;
        setIsLoading(true);

        try {
            let finalLat = coords.lat ?? 0;
            let finalLng = coords.lng ?? 0;

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
            };

            try {
                await vapi.start(assistantId, {
                    variableValues: variables,
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
    };

    const endCall = () => {
        vapi?.stop();
    };

    const togglePanel = () => {
        if (isConnected) {
            // Already on a call: the FAB itself ends it, no need to open a panel.
            endCall();
            return;
        }
        setPanelOpen((open) => !open);
    };

    const statusLabel = isLoading
        ? "Connecting…"
        : isSpeaking
        ? "Assistant is speaking…"
        : "Listening — tap to end";

    return (
        <div
            className={`fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3.5 ${
                className ?? ""
            }`}
            style={style}
        >
            {panelOpen && !isConnected && (
                <div className="w-[260px] bg-foreground p-5 shadow-[0_8px_24px_rgba(38,33,92,0.25)]">
                    <div className="flex justify-between items-start mb-2.5">
                        <div>
                            <div className="font-space-grotesk font-semibold text-sm text-white">
                                Report by voice
                            </div>
                            <div className="text-[11px] text-[#B5B0DD] mt-0.5">
                                No sign-in required
                            </div>
                        </div>
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="text-[#B5B0DD] hover:text-white p-0 bg-transparent border-none cursor-pointer"
                            aria-label="Close voice report panel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={startCall}
                        disabled={isLoading}
                        className="w-full font-space-grotesk font-semibold text-[13px] py-3 bg-accent hover:brightness-90 text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-[filter] disabled:opacity-60"
                    >
                        {isLoading ? (
                            <Loader2 className="w-[15px] h-[15px] animate-spin" />
                        ) : (
                            <Mic className="w-[15px] h-[15px]" />
                        )}
                        {isLoading ? "Connecting…" : "Start speaking"}
                    </button>
                </div>
            )}

            {isConnected && (
                <div className="px-4 py-2.5 bg-foreground text-white text-xs font-medium shadow-[0_8px_24px_rgba(38,33,92,0.25)]">
                    {statusLabel}
                </div>
            )}

            <button
                onClick={togglePanel}
                disabled={isLoading}
                title={
                    isConnected
                        ? "End voice report"
                        : "Report a civic issue by voice"
                }
                aria-label={
                    isConnected
                        ? "End voice report"
                        : "Report a civic issue by voice"
                }
                className={`w-14 h-14 rounded-full bg-accent hover:brightness-90 border-none flex items-center justify-center text-white shadow-[0_6px_18px_rgba(216,90,48,0.4)] transition-[filter,transform] disabled:cursor-default ${
                    isConnected && !isSpeaking ? "animate-pulse" : ""
                }`}
                style={{ cursor: isLoading ? "default" : "pointer" }}
            >
                {isLoading ? (
                    <Loader2 className="w-[22px] h-[22px] animate-spin" />
                ) : isConnected ? (
                    <X className="w-[22px] h-[22px]" />
                ) : (
                    <Mic className="w-[22px] h-[22px]" />
                )}
            </button>
        </div>
    );
};

export default VapiVoiceButton;
