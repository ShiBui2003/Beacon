"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
    MapPin,
    Shield,
    Zap,
    Users,
    TrendingUp,
    Check,
    Download,
    LogIn,
    Globe,
    Lock,
    ArrowRight,
    Star,
    Bell,
    BarChart3,
    Smartphone,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    gsap.registerPlugin(ScrollTrigger)

    const heroRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)
    const featuresRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const mm = gsap.matchMedia()

        mm.add(
            {
                reduceMotion: "(prefers-reduced-motion: reduce)",
                noPreference: "(prefers-reduced-motion: no-preference)",
            },
            (context) => {
                const { reduceMotion } = context.conditions as {
                    reduceMotion: boolean
                }

                if (reduceMotion) {
                    // Reduced motion: content is already visible in the DOM
                    // (no opacity-0 initial state is set below), so there is
                    // nothing further to do here.
                    return
                }

                if (heroRef.current) {
                    gsap.from(heroRef.current.children, {
                        opacity: 0,
                        y: 24,
                        duration: 0.7,
                        stagger: 0.12,
                        ease: "power2.out",
                    })
                }

                if (statsRef.current) {
                    gsap.from(statsRef.current.querySelectorAll(".stat-item"), {
                        opacity: 0,
                        y: 16,
                        duration: 0.5,
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: statsRef.current,
                            start: "top 85%",
                        },
                    })
                }

                if (featuresRef.current) {
                    gsap.from(
                        featuresRef.current.querySelectorAll(".feature-item"),
                        {
                            opacity: 0,
                            y: 24,
                            duration: 0.6,
                            stagger: 0.1,
                            scrollTrigger: {
                                trigger: featuresRef.current,
                                start: "top 80%",
                            },
                        }
                    )
                }
            }
        )

        return () => mm.revert()
    }, [])

    const features = [
        {
            icon: MapPin,
            title: "Real-time Reporting",
            description:
                "Report civic issues instantly with location-based mapping and photo documentation.",
        },
        {
            icon: Bell,
            title: "Smart Notifications",
            description:
                "Get instant updates on report status, government responses, and community activities.",
        },
        {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description:
                "Comprehensive insights and data visualization for administrators and citizens.",
        },
        {
            icon: Users,
            title: "Community Engagement",
            description:
                "Connect with local communities and participate in democratic decision-making.",
        },
        {
            icon: Shield,
            title: "Secure & Verified",
            description:
                "Government-grade security with verified user authentication and data protection.",
        },
        {
            icon: Zap,
            title: "Fast Response",
            description:
                "Quick resolution tracking with automated workflow and priority management.",
        },
    ];

    const stats = [
        { number: "50K+", label: "Active Citizens" },
        { number: "15K+", label: "Issues Resolved" },
        { number: "98%", label: "User Satisfaction" },
        { number: "24/7", label: "Support Available" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-primary/8 to-accent/8 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-primary/6 to-accent/6 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "2s" }}
                ></div>
                <div
                    className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-green-300/8 to-teal-400/8 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1s" }}
                ></div>
                <div
                    className="absolute bottom-10 right-1/3 w-64 h-64 bg-gradient-to-br from-primary/6 to-accent/6 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "3s" }}
                ></div>
            </div>

            {/* Navigation */}
            <nav className="bg-white/95 backdrop-blur-md border-b shadow-sm border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-primary">
                                JANMARG
                            </span>
                        </div>

                        <div className="flex items-center space-x-6">
                            <Link
                                href="/auth?mode=login"
                                className="text-primary hover:text-[var(--primary-hover)] font-medium flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                {/* Decorative Leaf Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-20 left-1/4 w-8 h-8 text-primary/60 animate-bounce"
                        style={{
                            animationDelay: "0.5s",
                            animationDuration: "4s",
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-full h-full"
                        >
                            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                        </svg>
                    </div>

                    <div
                        className="absolute top-1/3 right-1/4 w-6 h-6 text-emerald-600/70 animate-pulse"
                        style={{
                            animationDelay: "1s",
                            animationDuration: "3s",
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-full h-full rotate-45"
                        >
                            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                        </svg>
                    </div>

                    <div
                        className="absolute top-1/2 left-16 w-7 h-7 text-green-700/50 animate-pulse"
                        style={{
                            animationDelay: "3s",
                            animationDuration: "3.5s",
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-full h-full rotate-12"
                        >
                            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                        </svg>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div ref={heroRef} className="text-center space-y-8 max-w-4xl mx-auto">
                        <div className="inline-flex items-center bg-primary/10 text-primary hover:bg-primary/15 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105">
                            <Globe className="w-4 h-4 mr-2" />
                            Digital Governance Platform
                        </div>

                        <h1 className="text-4xl lg:text-7xl font-bold text-gray-900 leading-tight">
                            Connect with your city.
                            <span className="text-primary block mt-2">
                                Make it better.
                            </span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                            Report issues, track updates, and participate in
                            building stronger communities through digital
                            governance.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/auth?mode=signup"
                                className="bg-accent hover:brightness-90 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group flex items-center"
                            >
                                <Download className="w-5 h-5 mr-3" />
                                Get Started Free
                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="/auth?mode=login"
                                className="text-primary hover:text-[var(--primary-hover)] font-medium text-lg flex items-center group transition-all duration-300"
                            >
                                <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white/70 backdrop-blur-sm border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="stat-item text-center group hover:scale-105 transition-transform duration-300"
                            >
                                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-sm lg:text-base text-gray-700 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Preview Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                                <Smartphone className="w-4 h-4 mr-2" />
                                Mobile App
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
                                Everything you need
                                <span className="text-primary block">
                                    in your pocket
                                </span>
                            </h2>
                        </div>

                        <div className="max-w-md mx-auto">
                            <div className="bg-white/95 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-500 hover:scale-105 rounded-lg">
                                <div className="text-center pb-4 pt-6 px-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <Smartphone className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        Janmarg Mobile App
                                    </h3>
                                    <div className="flex items-center justify-center space-x-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                            />
                                        ))}
                                        <span className="ml-2 text-sm font-medium text-gray-600">
                                            4.8 (12K+ reviews)
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3 p-6">
                                    <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-medium text-emerald-800">
                                            Report civic issues instantly
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Bell className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-blue-800">
                                            Track resolution progress
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-medium text-purple-800">
                                            Community engagement
                                        </span>
                                    </div>
                                    <div className="pt-4">
                                        <Link
                                            href="/auth?mode=signup"
                                            className="w-full bg-primary hover:bg-[var(--primary-hover)] text-white py-3 rounded-lg group transition-all duration-300 flex items-center justify-center"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Get Started Now
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-6 mb-16">
                        <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            Platform Features
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
                            Built for citizens,
                            <span className="text-primary block">
                                powered by innovation
                            </span>
                        </h2>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                            Modern tools that make civic engagement simple,
                            transparent, and effective for everyone.
                        </p>
                    </div>

                    <div ref={featuresRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-item bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:scale-105 group rounded-lg p-6"
                            >
                                <div className="pb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-3">
                                        {feature.title}
                                    </h3>
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-secondary/95"></div>
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                            Ready to make a difference?
                        </h2>
                        <p className="text-xl lg:text-2xl text-emerald-50 leading-relaxed">
                            Join thousands building stronger communities through
                            digital governance.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/auth?mode=signup"
                                className="inline-block bg-white text-primary hover:bg-gray-100 px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:scale-105"
                            >
                                <Download className="w-5 h-5 mr-3 inline" />
                                Get Started Free
                                <ArrowRight className="w-5 h-5 ml-3 inline group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="pt-4">
                            <Link
                                href="/auth?mode=login"
                                className="text-emerald-100 hover:text-white font-medium text-lg flex items-center justify-center mx-auto group transition-all duration-300"
                            >
                                <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">
                                    JANMARG
                                </span>
                            </div>
                            <p className="text-gray-400">
                                Empowering digital democracy through
                                transparent, efficient, and responsive
                                governance.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">
                                Quick Links
                            </h3>
                            <div className="space-y-2">
                                <Link
                                    href="/auth?mode=signup"
                                    className="block text-gray-400 hover:text-white transition-colors"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    href="/auth?mode=login"
                                    className="block text-gray-400 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Contact</h3>
                            <div className="space-y-2 text-gray-400">
                                <p>support@janmarg.gov.in</p>
                                <p>+91 1800-XXX-XXXX</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>
                            © 2025 Janmarg. All rights reserved. | A Digital
                            India Initiative
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
