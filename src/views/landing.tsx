import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Brain, Target, Activity, Users, FileLock, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Landing() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    { icon: Brain, title: "Behavioral AI", desc: "Predictive modeling of employee actions before incidents occur." },
    { icon: Target, title: "Phishing Simulation", desc: "Hyper-realistic, targeted campaigns mirroring real-world APTs." },
    { icon: Shield, title: "Culture Intelligence", desc: "Quantifiable metrics on your organization's security posture." },
    { icon: Activity, title: "Human Risk Analytics", desc: "Real-time tracking of anomalous human behavior patterns." },
    { icon: Users, title: "Psychometric Assessments", desc: "Evaluate inherent susceptibility to manipulation tactics." },
    { icon: FileLock, title: "Executive Intelligence", desc: "Board-ready reports translating cyber risk into business impact." },
  ];

  const testimonials = [
    {
      quote: "CyberCultX gave us our first quantifiable view of human risk. Our board now receives a monthly intelligence briefing — something we could never produce before.",
      name: "Sarah Al-Rashidi",
      title: "CISO, Gulf Energy Corporation",
      initials: "SA",
    },
    {
      quote: "Within 90 days, our phishing click rate dropped by 67%. The behavioral segmentation engine targets exactly who needs training, when they need it.",
      name: "Mohammed Al-Hassan",
      title: "VP Information Security, Al Noor Financial Group",
      initials: "MA",
    },
    {
      quote: "The psychometric assessment layer revealed risk vectors our traditional security tools were completely blind to. A paradigm shift in how we think about insider threat.",
      name: "Dr. Layla Ibrahim",
      title: "Chief Risk Officer, Meridian Healthcare",
      initials: "LI",
    },
  ];

  const faqs = [
    {
      q: "How is CyberCultX different from standard security awareness training?",
      a: "Traditional SAT platforms deliver generic e-learning content and measure completion rates. CyberCultX measures actual behavioral risk using psychometrics, simulated attacks, and AI modeling — then delivers precision-targeted interventions. It's the difference between checking a compliance box and engineering a resilient security culture.",
    },
    {
      q: "How long does implementation typically take?",
      a: "Most organizations are fully operational within 2 weeks. Our onboarding team handles Active Directory / LDAP integration, department mapping, and baseline assessment configuration. You'll have your first risk report within 30 days.",
    },
    {
      q: "What languages does the platform support?",
      a: "CyberCultX is fully bilingual in Arabic and English with native RTL layout support for Arabic — critical for Gulf region deployments. Additional languages can be configured for regional rollout needs.",
    },
    {
      q: "How is human risk data protected?",
      a: "All behavioral and assessment data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are ISO 27001 aligned, support data residency in GCC regions, and provide full audit trails for compliance requirements.",
    },
    {
      q: "Can we integrate CyberCultX with our existing security stack?",
      a: "Yes. CyberCultX can connect with Microsoft Sentinel, Splunk, IBM QRadar, ServiceNow, and custom systems through approved integration workflows.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Intelligence Operations Center v2.0
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
              Transforming Human Risk Into{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Measurable Intelligence
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              CyberCultX is the elite enterprise platform that measures, predicts, and transforms organizational security culture. Stop chasing clicks. Start engineering resilience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(204,0,0,0.3)] w-full sm:w-auto group">
                  Book a Briefing
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border hover:bg-accent/10 w-full sm:w-auto">
                  Access Portal
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "67%", label: "Average phishing click-rate reduction" },
              { value: "2 wk", label: "Time to first intelligence report" },
              { value: "140+", label: "Enterprise deployments" },
              { value: "99.9%", label: "Platform uptime SLA" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10 bg-background/50 border-y border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Command Your Security Culture</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Deploy military-grade behavioral intelligence across your entire enterprise.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-card border border-card-border hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trusted by Security Leaders</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">See how enterprise CISOs are transforming their human risk programs.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card border border-card-border flex flex-col"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-primary fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1 italic mb-6">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Intelligence Briefing</h2>
            <p className="text-muted-foreground">Answers to the most common questions from security leaders.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-card-border bg-card/60 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 relative z-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/20 border border-primary/30"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              Ready to Measure What Matters?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join 140+ enterprises that have made human risk measurable, predictable, and actionable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  Book a Briefing
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 border-border hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
