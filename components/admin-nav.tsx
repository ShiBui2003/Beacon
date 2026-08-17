"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// ✅ Correct imports for UI components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import {
    BarChart3,
    Settings,
    User,
    LogOut,
    Menu,
    ChevronRight,
    Shield,
} from "lucide-react";

// ✅ Final merged navigation items
const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/issues", label: "Manage Issues", icon: Settings },
    { href: "/admin/profile", label: "Profile", icon: User },
];

// Page titles for breadcrumb
const getPageTitle = (pathname: string) => {
    const titles: { [key: string]: string } = {
        "/admin/dashboard": "Dashboard",
        "/admin/issues": "Manage Issues",
        "/admin/profile": "Profile",
    };

    return titles[pathname] || "Admin Panel";
};

export default function AdminNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
    };

    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Admin";

    return (
        <>
            {/* Main Navbar */}
            <div className="border-b bg-card sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Logo */}
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 min-w-0"
                        >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
                            </div>
                            <span className="font-semibold text-sm sm:text-base lg:text-lg truncate">
                                Admin Panel
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex lg:items-center lg:space-x-1 flex-1 justify-center">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const IconComponent = item.icon;

                                return (
                                    <Button
                                        key={item.href}
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        className="h-9 text-sm"
                                        asChild
                                    >
                                        <Link href={item.href as any}>
                                            {IconComponent && (
                                                <IconComponent className="w-4 h-4 mr-2" />
                                            )}
                                            {item.label}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </nav>

                        {/* Desktop User Actions */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-2 flex-shrink-0">
                            <Button
                                variant="default"
                                size="sm"
                                className="h-9 bg-primary hover:bg-[#1f4a3a] text-primary-foreground px-3 xl:px-4 text-sm"
                                asChild
                            >
                                <Link
                                    href="/admin/profile"
                                    className="flex items-center"
                                >
                                    <User className="w-4 h-4 mr-1.5 xl:mr-2" />
                                    <span className="hidden xl:inline max-w-[120px] truncate">
                                        {displayName}
                                    </span>
                                    <span className="xl:hidden">Profile</span>
                                </Link>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10 text-sm"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-1.5 xl:mr-2" />
                                <span className="hidden xl:inline">Logout</span>
                                <span className="xl:hidden">Exit</span>
                            </Button>
                        </div>

                        {/* Tablet Navigation (md to lg) */}
                        <div className="hidden md:flex lg:hidden items-center space-x-1">
                            {navItems.slice(0, 2).map((item) => {
                                const isActive = pathname === item.href;
                                const IconComponent = item.icon;

                                return (
                                    <Button
                                        key={item.href}
                                        variant={isActive ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 px-2"
                                        asChild
                                    >
                                        <Link href={item.href as any}>
                                            {IconComponent && (
                                                <IconComponent className="w-4 h-4" />
                                            )}
                                        </Link>
                                    </Button>
                                );
                            })}

                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-muted/50"
                                    >
                                        <Menu className="w-4 h-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-72 sm:w-80 md:w-96"
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-accent-foreground" />
                                                </div>
                                                <span className="font-semibold text-lg">
                                                    Menu
                                                </span>
                                            </div>
                                        </div>

                                        {/* Navigation Items */}
                                        <div className="flex-1 space-y-2 mb-6">
                                            <h3 className="text-sm font-medium text-muted-foreground px-2 mb-3">
                                                Navigation
                                            </h3>
                                            {navItems.map((item) => {
                                                const isActive =
                                                    pathname === item.href;
                                                const IconComponent = item.icon;

                                                return (
                                                    <Button
                                                        key={item.href}
                                                        variant={
                                                            isActive
                                                                ? "default"
                                                                : "ghost"
                                                        }
                                                        className="w-full justify-start h-11"
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
                                                        </Link>
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        {/* User Profile Section */}
                                        <div className="border-t pt-4 space-y-3">
                                            <div className="flex items-center gap-3 px-2 py-2">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate text-sm">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {user?.email ?? ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                <LogOut className="w-4 h-4 mr-3" />
                                                Logout
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Mobile Navigation (below md) */}
                        <div className="flex md:hidden items-center space-x-2">
                            {/* Hamburger Menu */}
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-muted/50"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-[85vw] max-w-sm"
                                >
                                    <div className="flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-accent-foreground" />
                                                </div>
                                                <span className="font-semibold text-base sm:text-lg">
                                                    Admin Panel
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Navigation Items */}
                                        <div className="flex-1">
                                            <div className="space-y-2 mb-6">
                                                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground px-2">
                                                    Navigation
                                                </h3>
                                                {navItems.map((item) => {
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
                                                            className="w-full justify-start h-10 sm:h-11 text-sm"
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
                                                            </Link>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* User Profile Section */}
                                        <div className="border-t pt-4 space-y-3">
                                            <div className="flex items-center gap-2.5 sm:gap-3 px-2 py-2">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate text-xs sm:text-sm">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                        {user?.email ?? ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-10 sm:h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    handleLogout();
                                                }}
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
            <div className="lg:hidden border-b bg-muted/30">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                            {getPageTitle(pathname)}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
