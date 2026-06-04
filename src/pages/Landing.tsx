import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Folder,
  FileText,
  Sparkles,
  Mail,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

const features = [
  {
    icon: FileText,
    title: "Upload Transcripts",
    description:
      "Paste or upload your meeting transcripts and let AI do the rest.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Summaries",
    description:
      "Get clear summaries, key decisions, and action items instantly.",
  },
  {
    icon: Folder,
    title: "Organized Workspace",
    description:
      "Keep all your meeting notes organized in folders, easy to find and access.",
  },
  {
    icon: Mail,
    title: "Instant Sharing",
    description:
      "Send meeting summaries to your team with one click — no copy-pasting needed.",
  },
];

const benefits = [
  "No more missed action items",
  "Save hours reviewing recordings",
  "Keep your team aligned",
  "Never forget key decisions",
];

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated gradient orbs background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(55 95% 75% / 0.55), transparent 70%)" }}
          animate={{ x: [0, 60, -20, 0], y: [0, 40, 20, 0], opacity: [0.55, 0.8, 0.6, 0.55] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(270 85% 82% / 0.5), transparent 70%)" }}
          animate={{ x: [0, -50, 30, 0], y: [0, 30, -20, 0], opacity: [0.5, 0.75, 0.55, 0.5] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 h-[34rem] w-[34rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(50 100% 80% / 0.45), transparent 70%)" }}
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 20, 0], opacity: [0.45, 0.7, 0.5, 0.45] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-2/3 right-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(280 90% 85% / 0.45), transparent 70%)" }}
          animate={{ x: [0, -40, 20, 0], y: [0, 30, -10, 0], opacity: [0.45, 0.7, 0.5, 0.45] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Logo size="sm" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Meeting Intelligence
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-10">
              <span className="text-foreground">Your meetings,</span>{" "}
              <span className="text-primary">summarized, stored and shared in seconds</span>
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free forever
            </p>
            <p className="text-base text-muted-foreground mt-10 max-w-2xl mx-auto">
              Upload your meeting transcripts and let AI generate clear summaries, decisions, and action items.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage meetings
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From upload to sharing, Incumeet handles the entire workflow so
              you can focus on what matters.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border p-6 shadow-card"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Never miss an important detail again
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a student, intern, or early-career professional,
                Incumeet helps you stay on top of every meeting.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="font-medium">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl border border-border p-8 shadow-elevated"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Q4 Planning Session</p>
                    <p className="text-xs text-muted-foreground">
                      3 action items • 4 decisions
                    </p>
                  </div>
                  <Star className="h-4 w-4 fill-starred text-starred" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Client Onboarding</p>
                    <p className="text-xs text-muted-foreground">
                      5 action items • 2 decisions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Team Standup</p>
                    <p className="text-xs text-muted-foreground">
                      2 action items • 1 decision
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your meetings?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Join professionals who never miss an action item.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleGetStarted}
              className="gap-2"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 Incumeet. Free forever.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
