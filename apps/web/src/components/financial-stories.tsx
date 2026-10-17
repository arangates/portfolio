"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@portfolio/ui/lib/utils";
import { Badge } from "@portfolio/ui/components/badge";
import {
  XIcon,
  PauseIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  SparklesIcon,
} from "@portfolio/ui/components/icons";

export type StorySlide = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  metric: string;
  subMetric?: string;
  badge?: {
    text: string;
    variant: "positive" | "negative" | "neutral" | "accent";
  };
  details: Array<{
    label: string;
    value: string;
    change?: string;
  }>;
  callToAction?: {
    label: string;
    href: string;
  };
  visualType: "pulse" | "allocation" | "runway" | "milestone" | "sovereignty";
  accentGradient: string;
};

export type FinancialStoryFeed = {
  updatedAt: string;
  userName: string;
  isSovereign: boolean;
  slides: StorySlide[];
};

const SLIDE_DURATION_MS = 6000;

export function FinancialStoriesModal({
  feed,
  isOpen,
  onClose,
}: {
  feed: FinancialStoryFeed;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const slides = feed.slides;
  const currentSlide = slides[currentIndex] || slides[0];

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [currentIndex, slides.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [currentIndex]);

  // Main animation timer loop
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      return;
    }

    if (isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const currentProgress = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);

      setProgress(currentProgress);

      if (currentProgress >= 100) {
        goToNext();
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isPaused, currentIndex, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goToNext();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || !currentSlide) return null;

  const handlePointerDown = () => {
    setIsPaused(true);
    elapsedBeforePauseRef.current = (progress / 100) * SLIDE_DURATION_MS;
  };

  const handlePointerUp = () => {
    setIsPaused(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Story Card Container (Mobile 9:16 aspect ratio or fullscreen on phones) */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col justify-between overflow-hidden bg-neutral-950 text-white shadow-2xl transition-all duration-300 sm:h-[840px] sm:max-h-[95vh] sm:w-[460px] sm:rounded-3xl border border-white/10",
        )}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Dynamic Glow Accent Gradient in Background */}
        <div
          className={cn(
            "pointer-events-none absolute -inset-10 opacity-70 blur-3xl transition-all duration-700 bg-gradient-to-br",
            currentSlide.accentGradient,
          )}
        />

        {/* Top Header Bar: Progress Bars + Meta + Controls */}
        <div className="relative z-20 flex flex-col gap-3 p-4 sm:p-5">
          {/* Segmented Progress Bars (Instagram / WhatsApp Status style) */}
          <div className="flex w-full items-center gap-1.5">
            {slides.map((slide, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div key={slide.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width: isPast ? "100%" : isCurrent ? `${progress}%` : "0%",
                      transitionDuration: isCurrent ? "16ms" : "0ms",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* User & Tag Meta Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 shadow-sm">
                <div className="flex size-full items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  S
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wide text-white/90">
                  Selvam Sovereign Pulse
                </span>
                <span className="text-[10px] font-medium tracking-wider text-white/50 uppercase">
                  {currentSlide.tag}
                </span>
              </div>
            </div>

            {/* Pause indicator & Close button */}
            <div className="flex items-center gap-1">
              {isPaused && (
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                  <PauseIcon className="size-2.5" />
                  Paused
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close stories"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle Slide Content */}
        <div className="relative z-20 flex flex-1 flex-col justify-center px-6 py-4">
          <div className="space-y-6">
            {/* Slide Badge */}
            {currentSlide.badge && (
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/20 text-xs font-medium px-2.5 py-1 backdrop-blur-md",
                    currentSlide.badge.variant === "positive" &&
                      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                    currentSlide.badge.variant === "negative" &&
                      "bg-rose-500/20 text-rose-300 border-rose-500/30",
                    currentSlide.badge.variant === "accent" &&
                      "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    currentSlide.badge.variant === "neutral" && "bg-white/10 text-white/80",
                  )}
                >
                  {currentSlide.badge.text}
                </Badge>
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {currentSlide.title}
              </h2>
              <p className="text-sm leading-relaxed text-white/70">{currentSlide.subtitle}</p>
            </div>

            {/* Main Primary Metric Display */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {currentSlide.metric}
              </div>
              {currentSlide.subMetric && (
                <div className="mt-1 text-sm font-medium text-white/60">
                  {currentSlide.subMetric}
                </div>
              )}
            </div>

            {/* Sub-details / Key-Value cards */}
            {currentSlide.details.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {currentSlide.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                  >
                    <div className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                      {detail.label}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{detail.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tap areas for Left / Right navigation */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-0 top-20 bottom-24 z-20 w-1/3 cursor-pointer opacity-0 focus:outline-none"
          aria-label="Previous slide"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-0 top-20 bottom-24 z-20 w-2/3 cursor-pointer opacity-0 focus:outline-none"
          aria-label="Next slide"
        />

        {/* Bottom Call To Action / Footer */}
        <div className="relative z-30 p-5 pt-2">
          {currentSlide.callToAction ? (
            <Link
              href={currentSlide.callToAction.href as any}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{currentSlide.callToAction.label}</span>
              <ArrowUpRightIcon className="size-4" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
              <ShieldCheckIcon className="size-4 text-emerald-400" />
              <span>Sovereign Local-First Operating System</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Story Ring Button that can be placed in SiteHeader or Dashboard
 */
export function FinancialStoriesTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [feed, setFeed] = useState<FinancialStoryFeed | null>(null);

  useEffect(() => {
    // Pre-fetch story pulse on client mount
    fetch("/api/stories/pulse")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.slides) setFeed(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium shadow-xs backdrop-blur-sm transition-all hover:border-foreground/30 hover:shadow-sm"
        title="Open Daily Financial Pulse Stories"
      >
        {/* Animated Gradient Pulse Ring */}
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="flex items-center gap-1.5 text-foreground/90 font-medium">
          <SparklesIcon className="size-3.5 text-amber-500" />
          <span>Daily Pulse</span>
        </span>
      </button>

      {feed && (
        <FinancialStoriesModal feed={feed} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
