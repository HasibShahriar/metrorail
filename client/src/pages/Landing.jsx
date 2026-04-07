import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Train, ArrowRight, Ticket, Clock, Map, ShieldCheck, ChevronRight, CheckCircle2, Building2, Users, Route } from "lucide-react";


const METRO_IMAGE =
  "https://images.unsplash.com/photo-1621220832984-1c215e65c3a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXRybyUyMHJhaWwlMjB0cmFpbiUyMG1vZGVybiUyMGNpdHl8ZW58MXx8fHwxNzc1NTA0Njc0fDA&ixlib=rb-4.1.0&q=80&w=1080";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

const FEATURES = [
  {
    icon: Ticket,
    title: "Online Ticket Booking",
    description:
      "Book your metro tickets instantly from anywhere. Choose your route, select seats, and get your digital ticket in seconds.",
    bgColor: "bg-blue-50",
    iconBg: "bg-blue-600",
    border: "border-blue-100",
    hover: "hover:border-blue-300 hover:shadow-blue-100",
    tag: "Most Popular",
  },
  {
    icon: Clock,
    title: "Live Train Schedule",
    description:
      "Access real-time train schedules, departure times, and live arrival updates for all metro lines across the network.",
    bgColor: "bg-indigo-50",
    iconBg: "bg-indigo-600",
    border: "border-indigo-100",
    hover: "hover:border-indigo-300 hover:shadow-indigo-100",
    tag: "Real-Time",
  },
  {
    icon: Map,
    title: "Route Management",
    description:
      "Explore and plan routes across all metro lines. Interactive maps help you navigate transfers and find optimal paths.",
    bgColor: "bg-violet-50",
    iconBg: "bg-violet-600",
    border: "border-violet-100",
    hover: "hover:border-violet-300 hover:shadow-violet-100",
    tag: "Smart Planning",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description:
      "Industry-grade encryption for all transactions. Pay with cards, wallets, or UPI — your payment data is always safe.",
    bgColor: "bg-emerald-50",
    iconBg: "bg-emerald-600",
    border: "border-emerald-100",
    hover: "hover:border-emerald-300 hover:shadow-emerald-100",
    tag: "256-bit SSL",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: Map,
    title: "Choose Route",
    description:
      "Select your origin and destination station from our comprehensive metro network map.",
    iconBg: "bg-blue-600",
    stepBg: "bg-blue-50",
    stepText: "text-blue-600",
  },
  {
    step: "02",
    icon: Train,
    title: "Select Train",
    description:
      "Pick the train that best fits your schedule. View live departure times and seat availability.",
    iconBg: "bg-indigo-600",
    stepBg: "bg-indigo-50",
    stepText: "text-indigo-600",
  },
  {
    step: "03",
    icon: Ticket,
    title: "Book Ticket",
    description:
      "Complete your booking with our secure payment gateway. Get an instant e-ticket via email or app.",
    iconBg: "bg-violet-600",
    stepBg: "bg-violet-50",
    stepText: "text-violet-600",
  },
  {
    step: "04",
    icon: CheckCircle2,
    title: "Travel",
    description:
      "Scan your QR code at the station gate and enjoy a hassle-free metro journey.",
    iconBg: "bg-emerald-600",
    stepBg: "bg-emerald-50",
    stepText: "text-emerald-600",
  },
];

const STATS = [
  {
    icon: Building2,
    value: 142,
    suffix: "+",
    label: "Metro Stations",
    description: "Across all lines",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Train,
    value: 84,
    suffix: "",
    label: "Active Trains",
    description: "Operating daily",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Users,
    value: 2.4,
    suffix: "M+",
    label: "Daily Passengers",
    description: "Rides completed",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    border: "border-violet-100",
    isDecimal: true,
  },
  {
    icon: Route,
    value: 12,
    suffix: "",
    label: "Routes Available",
    description: "Covering the city",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    border: "border-emerald-100",
  },
];

const METRO_STATIONS = [
  "Shahbagh",
  "Kawran Bazar",
  "Farmgate",
  "Bijoy Sarani",
  "Agargaon",
  "Shewrapara",
  "Mirpur 10",
];

const PERFORMANCE_BARS = [
  {
    label: "On-Time Performance",
    value: "97.8%",
    sub: "Last 30 days",
    bar: 97.8,
    color: "bg-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "App Satisfaction",
    value: "4.8 / 5",
    sub: "From 120K+ reviews",
    bar: 96,
    color: "bg-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "Network Uptime",
    value: "99.9%",
    sub: "System availability",
    bar: 99.9,
    color: "bg-emerald-500",
    bg: "bg-emerald-50",
  },
];

// ---------------------------------------------------------------------------
// Hook: Count-up animation
// ---------------------------------------------------------------------------

function useCountUp(target, isDecimal = false, shouldStart = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, isDecimal, shouldStart]);

  return count;
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
              <Train className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className="text-blue-700 tracking-tight"
                style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.2 }}
              >
                MetroRail
              </span>
              <span
                className="text-gray-400 tracking-widest uppercase"
                style={{ fontSize: "0.6rem", fontWeight: 500, lineHeight: 1 }}
              >
                Management System
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 relative group"
                style={{ fontSize: "0.9rem", fontWeight: 500 }}
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/Login")}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md shadow-blue-200"
              style={{ fontSize: "0.9rem", fontWeight: 500 }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2 px-3 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                style={{ fontSize: "0.9rem", fontWeight: 500 }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button className="w-full py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 pt-16"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 lg:py-24">
          {/* Left Content */}
          <div className="relative z-10">
            <h1
              className="text-white mb-6 leading-tight"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              Smart Metro Rail{" "}
              <span className="text-blue-300">Ticketing</span> &{" "}
              <span className="relative">
                Management
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10 Q75 2 150 8 Q225 14 298 6"
                    stroke="#60a5fa"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </span>{" "}
              System
            </h1>

            <p
              className="text-blue-200 mb-8 max-w-lg"
              style={{ fontSize: "1.1rem", fontWeight: 400, lineHeight: 1.7 }}
            >
              Plan your journey, book tickets, and travel smarter with our
              integrated metro rail platform. Real-time schedules, seamless
              payments, and effortless route planning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/Login")}
                className="group flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-xl shadow-blue-900/40"
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Book Ticket
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Content — Image */}
          <div className="relative z-10 hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-blue-400/20 blur-2xl scale-95" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/60 border border-white/10">
                <img
                  src={METRO_IMAGE}
                  alt="Modern Metro Rail"
                  className="w-full h-[440px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent" />
              </div>

              {/* Floating card — Live Train */}
              <div className="absolute -bottom-5 -left-8 bg-white rounded-2xl shadow-xl shadow-blue-900/20 p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse block" />
                </div>
                <div>
                  <p className="text-gray-800" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    Line 3 — Blue Line
                  </p>
                  <p className="text-green-600" style={{ fontSize: "0.72rem" }}>
                    Arriving in 2 minutes
                  </p>
                </div>
              </div>

              {/* Floating card — Passengers */}
              <div className="absolute -top-5 -right-6 bg-white rounded-2xl shadow-xl shadow-blue-900/20 p-4 border border-gray-100">
                <p
                  className="text-gray-500 uppercase tracking-wider mb-1"
                  style={{ fontSize: "0.65rem", fontWeight: 600 }}
                >
                  Today's Riders
                </p>
                <p className="text-blue-700" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  148,320
                </p>
                <div className="flex items-center gap-1 text-green-600 mt-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>+12.4% vs yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 80V40C240 0 480 60 720 40C960 20 1200 60 1440 40V80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features Section
// ---------------------------------------------------------------------------

function FeaturesSection() {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4">
            <span
              className="text-blue-600 uppercase tracking-widest"
              style={{ fontSize: "0.72rem", fontWeight: 700 }}
            >
              Platform Features
            </span>
          </div>
          <h2
            className="text-gray-900 mb-4"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Everything You Need to Travel{" "}
            <span className="text-blue-600">Smarter</span>
          </h2>
          <p className="text-gray-500" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
            Our comprehensive metro management platform provides all the tools for a seamless
            commuting experience — from booking to boarding.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group relative bg-white rounded-2xl border ${feature.border} p-6 shadow-sm ${feature.hover} hover:shadow-lg transition-all duration-300 cursor-pointer`}
              >
                <div className="absolute top-4 right-4">
                  <span
                    className={`${feature.bgColor} text-gray-600 rounded-full px-2.5 py-1`}
                    style={{ fontSize: "0.65rem", fontWeight: 600 }}
                  >
                    {feature.tag}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-3" style={{ fontSize: "1rem", fontWeight: 700 }}>
                  {feature.title}
                </h3>
                <p
                  className="text-gray-500 mb-4"
                  style={{ fontSize: "0.875rem", lineHeight: 1.65 }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-200">
          <div>
            <h3 className="text-white mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              Ready to get started?
            </h3>
            <p className="text-blue-200" style={{ fontSize: "0.9rem" }}>
              Join thousands of daily commuters using MetroRail platform.
            </p>
          </div>
          <button
            onClick={() => navigate("/Login")}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Start Booking Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works Section
// ---------------------------------------------------------------------------

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-4">
            <span
              className="text-indigo-600 uppercase tracking-widest"
              style={{ fontSize: "0.72rem", fontWeight: 700 }}
            >
              Simple Process
            </span>
          </div>
          <h2
            className="text-gray-900 mb-4"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Book Your Ticket in{" "}
            <span className="text-blue-600">4 Easy Steps</span>
          </h2>
          <p className="text-gray-500" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
            Getting from point A to point B has never been easier. Follow these simple steps to
            plan and book your metro journey.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {HOW_IT_WORKS_STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === HOW_IT_WORKS_STEPS.length - 1;
            return (
              <div key={item.step} className="relative group">
                {/* Connector arrow (desktop only, not after last item) */}
                {!isLast && (
                  <div className="hidden lg:flex absolute top-10 left-[calc(100%-8px)] w-8 z-10 items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 h-full">
                  {/* Step number + indicator dots */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-9 h-9 ${item.stepBg} ${item.stepText} rounded-lg flex items-center justify-center`}
                    >
                      <span style={{ fontSize: "0.78rem", fontWeight: 800 }}>{item.step}</span>
                    </div>
                    <div className="flex gap-1">
                      {HOW_IT_WORKS_STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? item.iconBg : "bg-gray-200"
                            }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 ${item.iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3
                    className="text-gray-900 mb-2"
                    style={{ fontSize: "1.05rem", fontWeight: 700 }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-gray-500" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Metro route line visual */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 overflow-x-auto">
          <p
            className="text-gray-500 uppercase tracking-widest mb-6 text-center"
            style={{ fontSize: "0.7rem", fontWeight: 700 }}
          >
            Sample Metro Route — Blue Line
          </p>
          <div className="flex items-center justify-center min-w-[600px] mx-auto max-w-3xl">
            {METRO_STATIONS.map((station, i) => (
              <div key={station} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${i === 0 || i === METRO_STATIONS.length - 1
                      ? "bg-blue-600 border-blue-600 scale-125"
                      : i === 3
                        ? "bg-blue-200 border-blue-400"
                        : "bg-white border-blue-400"
                      } z-10`}
                  />
                  <p
                    className="mt-2 text-gray-600 whitespace-nowrap text-center"
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: i === 0 || i === METRO_STATIONS.length - 1 ? 700 : 400,
                    }}
                  >
                    {station}
                  </p>
                </div>
                {i < METRO_STATIONS.length - 1 && (
                  <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500 -mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats Section — StatCard subcomponent
// ---------------------------------------------------------------------------

function StatCard({ stat, shouldStart }) {
  const Icon = stat.icon;
  const count = useCountUp(stat.value, stat.isDecimal, shouldStart);

  return (
    <div
      className={`relative bg-white rounded-2xl border ${stat.border} p-8 text-center shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500`}
      />
      <div
        className={`relative w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-7 h-7 ${stat.color}`} />
      </div>
      <div
        className={`${stat.color} mb-1`}
        style={{ fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.1 }}
      >
        {stat.isDecimal ? count.toFixed(1) : count}
        {stat.suffix}
      </div>
      <h3 className="text-gray-900 mb-1" style={{ fontSize: "1rem", fontWeight: 700 }}>
        {stat.label}
      </h3>
      <p className="text-gray-400" style={{ fontSize: "0.82rem" }}>
        {stat.description}
      </p>
    </div>
  );
}

function StatsSection() {
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4">
            <span
              className="text-blue-600 uppercase tracking-widest"
              style={{ fontSize: "0.72rem", fontWeight: 700 }}
            >
              By the Numbers
            </span>
          </div>
          <h2
            className="text-gray-900 mb-4"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Powering the City's{" "}
            <span className="text-blue-600">Transit Network</span>
          </h2>
          <p className="text-gray-500" style={{ fontSize: "1rem", lineHeight: 1.7 }}>
            Our platform serves millions of passengers every day, connecting communities across the
            metropolitan area with reliable rail transit.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} shouldStart={hasStarted} />
          ))}
        </div>

        {/* Performance bars */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {PERFORMANCE_BARS.map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p
                    className="text-gray-500 mb-0.5"
                    style={{ fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    {item.label}
                  </p>
                  <p className="text-gray-900" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                    {item.value}
                  </p>
                </div>
                <span
                  className={`${item.bg} text-gray-600 rounded-lg px-2 py-1`}
                  style={{ fontSize: "0.7rem", fontWeight: 600 }}
                >
                  {item.sub}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: hasStarted ? `${item.bar}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root Page Component (default export)
// ---------------------------------------------------------------------------

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
    </div>
  );
}