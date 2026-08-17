"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    MoreHorizontal,
    Eye,
    Edit,
    CheckCircle,
    AlertTriangle,
    Clock,
    Building2,
    X,
} from "lucide-react";

interface SimpleAdminActionsProps {
    issue: {
        id: string;
        status: string;
        title: string;
    };
    onAction: (action: string, issueId: string, status: string) => void;
    processing?: boolean;
}

export default function SimpleAdminActions({
    issue,
    onAction,
    processing = false,
}: SimpleAdminActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
    });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Calculate and keep dropdown position in sync while open (scroll/resize)
    useEffect(() => {
        if (!isOpen || !buttonRef.current) return;

        let frameId: number | null = null;

        const updatePosition = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = dropdownRef.current?.offsetWidth ?? 192; // 12rem
            const vw = window.innerWidth;
            const padding = 8; // viewport padding to avoid edges

            let left = rect.left + rect.width - dropdownWidth;
            // Place below by default
            let top = rect.bottom + 4;

            // Clamp horizontally within viewport
            if (left < padding) left = padding;
            if (left + dropdownWidth > vw - padding) {
                left = vw - dropdownWidth - padding;
            }

            // If not enough space below, try placing above (use approx height)
            const approxHeight = dropdownRef.current?.offsetHeight ?? 320;
            if (top + approxHeight > window.innerHeight - padding) {
                top = rect.top - approxHeight - 4;
                // If still off-screen, clamp to padding
                if (top < padding) top = padding;
            }

            setDropdownPosition({ top, left });
        };

        const scheduleUpdate = () => {
            if (frameId != null) return;
            frameId = window.requestAnimationFrame(() => {
                frameId = null;
                updatePosition();
            });
        };

        updatePosition();

        // Use capture to listen to scroll on bubbling-disabled scroll events of ancestors
        window.addEventListener("scroll", scheduleUpdate, true);
        window.addEventListener("resize", scheduleUpdate);

        return () => {
            if (frameId != null) cancelAnimationFrame(frameId);
            window.removeEventListener("scroll", scheduleUpdate, true);
            window.removeEventListener("resize", scheduleUpdate);
        };
    }, [isOpen]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen]);

    const handleAction = (action: string) => {
        // Close dropdown immediately for better UX
        setIsOpen(false);

        // Call the action with a small delay to ensure dropdown closes
        setTimeout(() => {
            onAction(action, issue.id, issue.status);
        }, 100);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                disabled={processing}
                className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                title={processing ? "Processing..." : "Actions"}
            >
                {processing ? (
                    <Clock className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                    <MoreHorizontal className="w-4 h-4" />
                )}
            </button>

            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed w-48 max-h-[60vh] overflow-auto bg-white border border-gray-200 rounded-md shadow-lg z-50"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                        }}
                    >
                        <div className="py-1">
                            {/* Header */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                                Quick Actions
                            </div>

                            {/* View & Edit Actions */}
                            <button
                                onClick={() => handleAction("view")}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                            </button>
                            <button
                                onClick={() => handleAction("edit")}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Issue
                            </button>

                            {/* Separator */}
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Status Actions
                            </div>

                            {/* Status-based Actions */}
                            {issue.status === "submitted" && (
                                <>
                                    <button
                                        onClick={() => handleAction("accept")}
                                        className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accept Issue
                                    </button>
                                    <button
                                        onClick={() => handleAction("reject")}
                                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Reject Issue
                                    </button>
                                </>
                            )}

                            {(issue.status === "assigned" ||
                                issue.status === "submitted") && (
                                <button
                                    onClick={() => handleAction("in_progress")}
                                    className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Start Work
                                </button>
                            )}

                            {issue.status === "in_progress" && (
                                <button
                                    onClick={() => handleAction("resolve")}
                                    className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Resolved
                                </button>
                            )}

                            {issue.status !== "closed" &&
                                issue.status !== "resolved" && (
                                    <>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={() =>
                                                handleAction("close")
                                            }
                                            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Close Issue
                                        </button>
                                    </>
                                )}

                            {/* Management Actions */}
                            <div className="border-t border-gray-100 my-1"></div>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Management
                            </div>
                            <button
                                onClick={() => handleAction("assign")}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Building2 className="w-4 h-4 mr-2" />
                                Assign Department
                            </button>
                            <button
                                onClick={() => handleAction("priority")}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Change Priority
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
