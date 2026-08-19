"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Home,
    Plus,
    FileText,
    Bell,
    User,
    LogOut,
    Menu,
    Flag,
    DollarSign,
    ChevronRight,
} from "lucide-react";
import RealTimeNotifications from "@/components/real-time-notifications";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/theme-toggle";

// Navigation items for desktop
type NavItem = {
    href: string;
    label: string;
    icon: typeof Home;
    badge?: number;
};

const navItems: NavItem[] = [
    {
        href: "/citizen/dashboard",
        label: "Dashboard",
        icon: Home,
    },
    {
        href: "/citizen/report",
        label: "Report Issue",
        icon: Plus,
    },
    {
        href: "/citizen/issues",
        label: "My Issues",
        icon: FileText,
    },
];

// Mobile menu items (profile, funds, etc.)
const mobileMenuItems = [
    {
        href: "/citizen/profile",
        label: "Profile",
        icon: User,
    },
    {
        href: "/citizen/crowdfunding",
        label: "₹ Funds",
        icon: DollarSign,
    },
    {
        href: "/citizen/Abhiyaan",
        label: "Abhiyaan",
        icon: Flag,
    },
    {
        href: "/citizen/notifications",
        label: "Notifications",
        icon: Bell,
        badge: 3, // Unread count
    },
];

// Page titles for breadcrumb
const getPageTitle = (pathname: string) => {
    const titles: { [key: string]: string } = {
        "/citizen/dashboard": "Dashboard",
        "/citizen/report": "Report Issue",
        "/citizen/issues": "My Issues",
        "/citizen/notifications": "Notifications",
        "/citizen/profile": "Profile",
        "/citizen/crowdfunding": "₹ Funds",
        "/citizen/Abhiyaan": "Abhiyaan",
        "/citizen/leaderboard": "Leaderboard",
        "/citizen/resolved": "Resolved Issues",
    };

    return titles[pathname] || "CivicReport";
};

export default function CitizenNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut } = useAuth();

    const displayName =
        (user?.user_metadata as any)?.full_name ||
        (user?.user_metadata as any)?.name ||
        (user?.email ? String(user.email).split("@")[0] : undefined) ||
        "Profile";

    const NavItems = ({
        mobile = false,
        onItemClick,
    }: {
        mobile?: boolean;
        onItemClick?: () => void;
    }) => (
        <nav
            className={
                mobile
                    ? "flex flex-col space-y-2"
                    : "hidden lg:flex lg:items-center lg:space-x-1"
            }
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;

                return (
                    <Button
                        key={item.href}
                        variant={isActive ? "default" : "ghost"}
                        size={mobile ? "default" : "sm"}
                        asChild
                        className={`relative ${
                            mobile
                                ? "w-full justify-start h-11 mobile-menu-item"
                                : "h-9"
                        }`}
                        onClick={onItemClick}
                    >
                        <Link href={item.href as any}>
                            {IconComponent && (
                                <IconComponent className="w-4 h-4 mr-2" />
                            )}
                            {item.label}
                            {item.badge && (
                                <Badge
                                    variant="destructive"
                                    className="ml-auto px-1 py-0 text-xs"
                                >
                                    {item.badge}
                                </Badge>
                            )}
                        </Link>
                    </Button>
                );
            })}
        </nav>
    );

    // Use the unified auth context logout
    const handleLogout = async () => {
        await signOut();
    };

    return (
        <>
            {/* Main Navbar */}
            <div className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link
                            href="/citizen/dashboard"
                            className="flex items-center space-x-2 flex-shrink-0 group"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-[#2E6A56] to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-base sm:text-lg text-[#2E6A56]">
                                JANMARG
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <NavItems />

                        {/* Desktop User Actions */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-2">
                            <ThemeToggle />
                            {/* Additional Desktop Buttons */}
                            <div className="flex items-center space-x-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-foreground hover:bg-muted/50"
                                    asChild
                                >
                                    <Link
                                        href="/citizen/crowdfunding"
                                        className="flex items-center"
                                    >
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        <span className="hidden xl:inline">
                                            ₹ Funds
                                        </span>
                                        <span className="xl:hidden">₹</span>
                                    </Link>
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-foreground hover:bg-muted/50"
                                    asChild
                                >
                                    <Link
                                        href="/citizen/Abhiyaan"
                                        className="flex items-center"
                                    >
                                        <Flag className="w-4 h-4 mr-1" />
                                        <span className="hidden xl:inline">
                                            Abhiyaan
                                        </span>
                                        <span className="xl:hidden">Flag</span>
                                    </Link>
                                </Button>
                            </div>

                            {/* Combined Profile Button with Notifications */}
                            <div className="flex items-center space-x-2">
                                <RealTimeNotifications />
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-9 bg-primary hover:bg-[#1f4a3a] text-primary-foreground px-4"
                                    asChild
                                >
                                    <Link
                                        href="/citizen/profile"
                                        className="flex items-center"
                                    >
                                        <Avatar className="w-6 h-6 mr-2">
                                            <AvatarImage
                                                src={
                                                    (user?.user_metadata as any)
                                                        ?.avatar_url ||
                                                    (user?.user_metadata as any)
                                                        ?.picture ||
                                                    "/placeholder.svg"
                                                }
                                                alt={displayName}
                                            />
                                            <AvatarFallback className="bg-white text-primary text-xs font-bold">
                                                {String(displayName)
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden xl:inline">
                                            {displayName}
                                        </span>
                                        <span className="xl:hidden">
                                            Profile
                                        </span>
                                    </Link>
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                <span className="hidden xl:inline">Logout</span>
                            </Button>
                        </div>

                        {/* Mobile Navigation - Only Bell Icon and Hamburger Menu */}
                        <div className="flex lg:hidden items-center space-x-2">
                            {/* Notifications Bell Icon */}
                            <RealTimeNotifications />

                            {/* Hamburger Menu */}
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 hover:bg-muted/50 transition-colors"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-80 sm:w-96 transition-all duration-300 ease-in-out"
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                                    <Home className="w-5 h-5 text-accent-foreground" />
                                                </div>
                                                <span className="font-semibold text-lg">
                                                    CivicReport
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Navigation Items */}
                                        <div className="flex-1">
                                            <div className="space-y-2 mb-6">
                                                <h3 className="text-sm font-medium text-muted-foreground px-2">
                                                    Navigation
                                                </h3>
                                                <NavItems
                                                    mobile
                                                    onItemClick={() =>
                                                        setIsOpen(false)
                                                    }
                                                />
                                            </div>

                                            {/* Mobile Menu Items */}
                                            <div className="space-y-2 mb-6">
                                                <h3 className="text-sm font-medium text-muted-foreground px-2">
                                                    Account & More
                                                </h3>
                                                {mobileMenuItems.map((item) => {
                                                    const isActive =
                                                        pathname === item.href;
                                                    const IconComponent =
                                                        item.icon;

                                                    return (
                                                        <Button
                                                            key={item.href}
                                                            variant={
                                                                isActive
                                                                    ? "default"
                                                                    : "ghost"
                                                            }
                                                            className="w-full justify-start h-11 transition-all duration-200 mobile-menu-item"
                                                            asChild
                                                            onClick={() =>
                                                                setIsOpen(false)
                                                            }
                                                        >
                                                            <Link
                                                                href={
                                                                    item.href as any
                                                                }
                                                            >
                                                                {IconComponent && (
                                                                    <IconComponent className="w-4 h-4 mr-3" />
                                                                )}
                                                                {item.label}
                                                                {item.badge && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="ml-auto px-1 py-0 text-xs"
                                                                    >
                                                                        {
                                                                            item.badge
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </Link>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* User Profile Section */}
                                        <div className="border-t pt-4 space-y-3">
                                            <div className="flex items-center gap-3 px-2 py-2">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage
                                                        src={
                                                            (
                                                                user?.user_metadata as any
                                                            )?.avatar_url ||
                                                            (
                                                                user?.user_metadata as any
                                                            )?.picture ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt={displayName}
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {String(displayName)
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate text-sm">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {user?.email ?? ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between px-2 py-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Theme
                                                </span>
                                                <ThemeToggle />
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="w-4 h-4 mr-3" />
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Breadcrumb/Page Title */}
            <div className="lg:hidden border-b bg-muted/30 mobile-navbar-breadcrumb">
                <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 mobile-navbar-container">
                    <div className="flex items-center space-x-2">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                            {getPageTitle(pathname)}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
