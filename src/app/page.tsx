"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Brain,
  BarChart3,
  Volume2,
  Sparkles,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Create & Organize",
    description:
      "Build custom flashcard decks with an intuitive editor. Import from JSON or create from scratch.",
  },
  {
    icon: Brain,
    title: "Smart Study Mode",
    description:
      "Flip cards, mark difficulty, and track what you know. Shuffle for randomized practice.",
  },
  {
    icon: BarChart3,
    title: "Learning Analytics",
    description:
      "Track accuracy, study streaks, and identify hard words. Visualize your progress over time.",
  },
  {
    icon: Volume2,
    title: "Voice Pronunciation",
    description:
      "Hear words spoken aloud with US English pronunciation. Perfect for language learning.",
  },
  {
    icon: BookOpen,
    title: "Public Decks",
    description:
      "Share your decks with the community or study from public collections created by others.",
  },
  {
    icon: Zap,
    title: "Instant Performance",
    description:
      "Built with Next.js 15 for lightning-fast page loads. Study seamlessly across all devices.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Flashcard Learning
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Master Anything with{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Smart Flashcards
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Create beautiful flashcard decks, study with intelligent tracking,
              and watch your knowledge grow. Free, fast, and built for serious
              learners.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Button size="lg" className="gap-2 px-8" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="gap-2 px-8" asChild>
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="px-8" asChild>
                    <Link href="/explore">Browse Public Decks</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">∞</span>
                <span>Free Decks</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">🔊</span>
                <span>Voice Support</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground">📊</span>
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to{" "}
              <span className="text-primary">learn effectively</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete flashcard ecosystem with the tools you need to study
              smarter, not harder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40">
        <div className="container mx-auto max-w-7xl px-4 py-24">
          <div className="relative overflow-hidden rounded-2xl gradient-primary p-12 text-center">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to supercharge your learning?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of learners using ANN Flash to master new
                subjects every day.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="px-8 gap-2"
                asChild
              >
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Go to Dashboard" : "Start Learning Now"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
