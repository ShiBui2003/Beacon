"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

interface Phase {
    label: string
    detail: string
    railClass: string
    badgeClass: string
}

const PHASES: Phase[] = [
    {
        label: "SUBMITTED",
        detail: "Filed 0:02 ago via photo upload",
        railClass: "border-l-[#C9C6DA]",
        badgeClass: "bg-white text-caption-foreground border border-[#C9C6DA]",
    },
    {
        label: "AI SCORING",
        detail: "Gemini + BART scoring urgency now",
        railClass: "border-l-accent",
        badgeClass: "bg-accent text-white border-transparent",
    },
    {
        label: "ROUTED · HIGH",
        detail: "Sent to Public Safety, confidence 0.94",
        railClass: "border-l-primary",
        badgeClass: "bg-primary text-white border-transparent",
    },
    {
        label: "RESOLVED",
        detail: "Closed by field crew, 3h 40m total",
        railClass: "border-l-[#26215C]",
        badgeClass: "bg-[#26215C] text-white border-transparent",
    },
]

const FOCUS_RING =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"

export default function HomePage() {
    const [phaseIndex, setPhaseIndex] = useState(0)
    const heroLeftRef = useRef<HTMLDivElement>(null)
    const howLineRef = useRef<HTMLDivElement>(null)
    const howStepsRef = useRef<HTMLDivElement>(null)
    const aiShowcaseRef = useRef<HTMLDivElement>(null)

    // Signature element: cycles through the report lifecycle every 2.4s.
    // Skipped entirely under prefers-reduced-motion, resting on "Resolved".
    useEffect(() => {
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        if (reduced) {
            setPhaseIndex(PHASES.length - 1)
            return
        }
        const interval = setInterval(() => {
            setPhaseIndex((i) => (i + 1) % PHASES.length)
        }, 2400)
        return () => clearInterval(interval)
    }, [])

    useGSAP(() => {
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
                if (reduceMotion) return

                gsap.registerPlugin(ScrollTrigger)

                if (heroLeftRef.current) {
                    gsap.fromTo(
                        heroLeftRef.current,
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: "power2.out",
                            immediateRender: false,
                        }
                    )
                }

                if (howLineRef.current) {
                    gsap.fromTo(
                        howLineRef.current,
                        { scaleX: 0, transformOrigin: "left" },
                        {
                            scaleX: 1,
                            duration: 0.9,
                            ease: "power2.inOut",
                            immediateRender: false,
                            scrollTrigger: {
                                trigger: howLineRef.current,
                                start: "top 82%",
                            },
                        }
                    )
                }

                if (howStepsRef.current) {
                    const steps =
                        howStepsRef.current.querySelectorAll(".how-step")
                    steps.forEach((el, i) => {
                        gsap.fromTo(
                            el,
                            { opacity: 0, y: 18 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.5,
                                delay: i * 0.12,
                                ease: "power2.out",
                                immediateRender: false,
                                scrollTrigger: { trigger: el, start: "top 85%" },
                            }
                        )
                    })
                }

                if (aiShowcaseRef.current) {
                    const fields =
                        aiShowcaseRef.current.querySelectorAll(".ai-field")
                    fields.forEach((el, i) => {
                        gsap.fromTo(
                            el,
                            { opacity: 0, x: -12 },
                            {
                                opacity: 1,
                                x: 0,
                                duration: 0.45,
                                delay: i * 0.15,
                                ease: "power2.out",
                                immediateRender: false,
                                scrollTrigger: {
                                    trigger: aiShowcaseRef.current,
                                    start: "top 78%",
                                },
                            }
                        )
                    })
                }
            }
        )

        return () => mm.revert()
    }, [])

    const phase = PHASES[phaseIndex]

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Nav */}
            <nav className="sticky top-0 z-20 flex items-center justify-between h-[76px] px-6 md:px-12 bg-background border-b border-border">
                <div className="flex items-center gap-2.5">
                    <div className="relative w-[30px] h-[30px] bg-foreground">
                        <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 bg-accent -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="font-space-grotesk font-bold text-xl tracking-wide text-foreground">
                        BEACON
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-7">
                    <a
                        href="#how"
                        className={`text-secondary hover:text-foreground text-[15px] font-medium ${FOCUS_RING}`}
                    >
                        How it works
                    </a>
                    <a
                        href="#ai-layer"
                        className={`text-secondary hover:text-foreground text-[15px] font-medium ${FOCUS_RING}`}
                    >
                        The AI layer
                    </a>
                    <a
                        href="#staff"
                        className={`text-secondary hover:text-foreground text-[15px] font-medium ${FOCUS_RING}`}
                    >
                        For departments
                    </a>
                    <Link
                        href="/auth?mode=login"
                        className={`text-foreground font-medium text-[15px] ${FOCUS_RING}`}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/citizen/report"
                        className={`font-space-grotesk font-semibold text-[15px] px-[22px] py-[11px] bg-accent text-white hover:brightness-90 transition-[filter] ${FOCUS_RING}`}
                    >
                        Report an issue
                    </Link>
                </div>
                <Link
                    href="/citizen/report"
                    className={`md:hidden font-space-grotesk font-semibold text-sm px-4 py-2.5 bg-accent text-white hover:brightness-90 transition-[filter] ${FOCUS_RING}`}
                >
                    Report
                </Link>
            </nav>

            {/* Hero */}
            <section className="max-w-[1220px] mx-auto px-6 md:px-12 pt-16 md:pt-[88px] pb-16 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
                <div ref={heroLeftRef} className="opacity-100">
                    <div className="inline-flex items-center gap-2 px-3.5 py-[7px] border border-ring text-[13px] font-semibold text-secondary font-space-grotesk mb-6">
                        Built for municipal &amp; campus infrastructure
                    </div>
                    <h1 className="font-space-grotesk font-bold text-4xl md:text-5xl leading-[1.1] mb-5 text-foreground">
                        A cracked sidewalk and a live wire don&apos;t belong in
                        the same queue.
                    </h1>
                    <p className="text-[17px] leading-[1.65] text-muted-foreground max-w-[500px] mb-8">
                        Beacon reads every report — photo, voice, or text —
                        the second it&apos;s filed, scores how dangerous it
                        actually is, and routes it to the department that
                        owns it. Triage stops depending on who shouts
                        loudest.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        <Link
                            href="/citizen/report"
                            className={`font-space-grotesk font-semibold text-base px-7 py-[15px] bg-accent text-white hover:brightness-90 transition-[filter] ${FOCUS_RING}`}
                        >
                            Report an issue
                        </Link>
                        <Link
                            href="/auth?mode=login"
                            className={`font-space-grotesk font-semibold text-base px-7 py-[15px] border-[1.5px] border-foreground text-foreground hover:bg-foreground hover:text-white transition-colors ${FOCUS_RING}`}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Signature element: live report lifecycle */}
                <div className="border border-border bg-card p-7">
                    <div className="flex items-center justify-between mb-5">
                        <span className="font-space-grotesk text-xs font-bold text-caption-foreground uppercase tracking-wider">
                            One report, followed live
                        </span>
                        <span className="text-[11px] text-caption-foreground">
                            #BC-4471
                        </span>
                    </div>

                    <div
                        className={`border border-border border-l-4 ${phase.railClass} px-[18px] pt-[18px] pb-5 mb-5 transition-colors duration-500`}
                    >
                        <div className="font-semibold text-[15px] text-foreground mb-1">
                            Downed power line, Elm &amp; 4th
                        </div>
                        <div className="text-xs text-caption-foreground mb-3.5">
                            {phase.detail}
                        </div>
                        <span
                            className={`font-space-grotesk text-[11px] font-bold px-2.5 py-[5px] tracking-wide transition-colors duration-300 ${phase.badgeClass}`}
                        >
                            {phase.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {PHASES.map((p, i) => (
                            <div
                                key={p.label}
                                className={`flex-1 h-1 transition-colors duration-300 ${
                                    i <= phaseIndex
                                        ? phase.railClass.replace(
                                              "border-l-",
                                              "bg-"
                                          )
                                        : "bg-border"
                                }`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] text-caption-foreground font-space-grotesk">
                            SUBMITTED
                        </span>
                        <span className="text-[10px] text-caption-foreground font-space-grotesk">
                            AI SCORING
                        </span>
                        <span className="text-[10px] text-caption-foreground font-space-grotesk">
                            ROUTED
                        </span>
                        <span className="text-[10px] text-caption-foreground font-space-grotesk">
                            RESOLVED
                        </span>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section
                id="how"
                className="max-w-[1220px] mx-auto px-6 md:px-12 py-14"
            >
                <div className="flex items-baseline justify-between mb-11 border-b border-border pb-4.5">
                    <h2 className="font-space-grotesk font-bold text-[30px] text-foreground">
                        How a report flows
                    </h2>
                    <span className="text-[13px] text-caption-foreground hidden sm:inline">
                        Photo, voice, or text → routed department
                    </span>
                </div>
                <div className="relative">
                    <div
                        ref={howLineRef}
                        className="absolute top-2 left-0 right-0 h-px bg-border hidden md:block"
                    />
                    <div
                        ref={howStepsRef}
                        className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-0 relative"
                    >
                        <div className="how-step md:pr-6">
                            <div className="w-4 h-4 rounded-full bg-accent mb-4" />
                            <h3 className="font-space-grotesk text-base font-semibold mb-2 text-foreground">
                                Citizen files a report
                            </h3>
                            <p className="text-[13.5px] leading-[1.6] text-muted-foreground">
                                Photo, voice, or typed text — in Hindi,
                                Bengali, Tamil, Telugu, Marathi, Gujarati,
                                Punjabi, Urdu, or English.
                            </p>
                        </div>
                        <div className="how-step md:px-6">
                            <div className="w-4 h-4 rounded-full bg-accent mb-4" />
                            <h3 className="font-space-grotesk text-base font-semibold mb-2 text-foreground">
                                Gemini reads the photo
                            </h3>
                            <p className="text-[13.5px] leading-[1.6] text-muted-foreground">
                                Vision model extracts title, category, and an
                                initial urgency guess — no hard cutoff blocks
                                a submission.
                            </p>
                        </div>
                        <div className="how-step md:px-6">
                            <div className="w-4 h-4 rounded-full bg-accent mb-4" />
                            <h3 className="font-space-grotesk text-base font-semibold mb-2 text-foreground">
                                BART re-scores async
                            </h3>
                            <p className="text-[13.5px] leading-[1.6] text-muted-foreground">
                                Zero-shot classification against
                                low/medium/high overwrites priority moments
                                after the report is saved.
                            </p>
                        </div>
                        <div className="how-step md:pl-6">
                            <div className="w-4 h-4 rounded-full bg-accent mb-4" />
                            <h3 className="font-space-grotesk text-base font-semibold mb-2 text-foreground">
                                Routed to a department
                            </h3>
                            <p className="text-[13.5px] leading-[1.6] text-muted-foreground">
                                Category maps to one of the department
                                queues, scoped so no department sees
                                another&apos;s backlog.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI layer */}
            <section id="ai-layer" className="bg-[#26215C] py-16 md:py-[72px] px-6 md:px-12">
                <div className="max-w-[1220px] mx-auto">
                    <div className="flex items-baseline justify-between mb-11 flex-wrap gap-2">
                        <h2 className="font-space-grotesk font-bold text-[30px] text-white">
                            The AI layer, in one submission
                        </h2>
                        <span className="text-[13px] text-[#B5B0DD]">
                            Two independent scoring passes, one report
                        </span>
                    </div>
                    <div
                        ref={aiShowcaseRef}
                        className="grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr] border border-secondary"
                    >
                        <div className="bg-[#312A70] p-8 flex flex-col justify-center gap-1.5">
                            <div className="w-full h-40 bg-[#26215C] border border-secondary mb-4 flex items-center justify-center">
                                <svg
                                    width="34"
                                    height="34"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#7F77DD"
                                    strokeWidth="1.6"
                                >
                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                    <circle cx="12" cy="13" r="3" />
                                </svg>
                            </div>
                            <span className="text-xs text-[#B5B0DD]">
                                Submitted photo
                            </span>
                        </div>
                        <div className="bg-[#26215C] p-8 flex flex-col gap-px">
                            <div className="ai-field flex justify-between py-3.5 px-1 border-b border-secondary">
                                <span className="text-[13px] text-[#B5B0DD]">
                                    Title (Gemini)
                                </span>
                                <span className="text-[13px] font-semibold text-white text-right">
                                    Downed power line near school gate
                                </span>
                            </div>
                            <div className="ai-field flex justify-between py-3.5 px-1 border-b border-secondary">
                                <span className="text-[13px] text-[#B5B0DD]">
                                    Category (Gemini)
                                </span>
                                <span className="text-[13px] font-semibold text-white">
                                    Public Safety
                                </span>
                            </div>
                            <div className="ai-field flex justify-between items-center py-3.5 px-1 border-b border-secondary">
                                <span className="text-[13px] text-[#B5B0DD]">
                                    Initial urgency (Gemini)
                                </span>
                                <span className="font-space-grotesk text-[11px] font-bold px-2.5 py-1 bg-accent text-white">
                                    HIGH
                                </span>
                            </div>
                            <div className="ai-field flex justify-between items-center py-3.5 px-1">
                                <span className="text-[13px] text-[#B5B0DD]">
                                    Re-scored (BART, async)
                                </span>
                                <span className="font-space-grotesk text-[11px] font-bold px-2.5 py-1 bg-accent text-white">
                                    HIGH · 0.94 confidence
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[13px] text-[#8983BB] mt-5 max-w-[640px]">
                        Gemini&apos;s guess seeds the priority at intake;
                        BART&apos;s independent pass overwrites it moments
                        later. The two are allowed to disagree — urgency
                        gets checked twice, not assumed once.
                    </p>
                </div>
            </section>

            {/* For departments */}
            <section
                id="staff"
                className="max-w-[1220px] mx-auto px-6 md:px-12 py-16 md:py-[72px]"
            >
                <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-[7px] border border-ring text-[13px] font-semibold text-secondary font-space-grotesk mb-5">
                            For departments
                        </div>
                        <h2 className="font-space-grotesk font-bold text-[30px] mb-4 text-foreground">
                            Every department sees its own queue, nothing
                            else.
                        </h2>
                        <p className="text-[15px] leading-[1.65] text-muted-foreground mb-5">
                            A six-level role hierarchy — from field worker to
                            department head — scopes every queue to that
                            department or unassigned. Sorted by urgency and
                            community signal, not submission order.
                        </p>
                        <Link
                            href="/auth?mode=login"
                            className={`font-space-grotesk font-semibold text-sm text-foreground border-b-[1.5px] border-foreground ${FOCUS_RING}`}
                        >
                            See the staff dashboard →
                        </Link>
                    </div>
                    <div className="border border-border bg-card">
                        <div className="px-5 py-3.5 border-b border-border flex justify-between items-center">
                            <span className="font-space-grotesk font-semibold text-[13px] text-foreground">
                                Public Works — queue
                            </span>
                            <span className="text-[11px] text-caption-foreground">
                                unassigned + mine only
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0EFF6]">
                                <span className="text-[13px] text-foreground">
                                    Downed power line, Elm &amp; 4th
                                </span>
                                <span className="font-space-grotesk text-[10px] font-bold px-2 py-1 bg-accent text-white">
                                    HIGH
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0EFF6]">
                                <span className="text-[13px] text-foreground">
                                    Streetlight out, Park Row
                                </span>
                                <span className="font-space-grotesk text-[10px] font-bold px-2 py-1 border border-ring text-secondary">
                                    MEDIUM
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-5 py-3.5">
                                <span className="text-[13px] text-foreground">
                                    Cracked sidewalk slab
                                </span>
                                <span className="font-space-grotesk text-[10px] font-bold px-2 py-1 border border-border text-caption-foreground">
                                    LOW
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-[1220px] mx-auto px-6 md:px-12 py-20 text-center border-t border-border">
                <h2 className="font-space-grotesk font-bold text-[28px] md:text-[34px] mb-4 text-foreground">
                    Every report gets read the same second it&apos;s filed.
                </h2>
                <p className="text-base text-muted-foreground max-w-[460px] mx-auto mb-8">
                    File a report or sign in to track the ones you&apos;ve
                    already sent.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <Link
                        href="/citizen/report"
                        className={`font-space-grotesk font-semibold text-base px-8 py-4 bg-accent text-white hover:brightness-90 transition-[filter] ${FOCUS_RING}`}
                    >
                        Report an issue
                    </Link>
                    <Link
                        href="/auth?mode=login"
                        className={`font-space-grotesk font-semibold text-base px-8 py-4 border-[1.5px] border-foreground text-foreground hover:bg-foreground hover:text-white transition-colors ${FOCUS_RING}`}
                    >
                        Sign in
                    </Link>
                </div>
            </section>

            <footer className="border-t border-border px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <span className="font-space-grotesk font-bold text-[15px] text-foreground">
                    BEACON
                </span>
                <span className="text-[13px] text-caption-foreground">
                    Civic issue triage, built for departments that can&apos;t
                    read every ticket by hand.
                </span>
            </footer>
        </div>
    )
}
