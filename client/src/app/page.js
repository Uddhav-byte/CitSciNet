'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe, Map, Sparkles, Target, ArrowRight, Microscope,
  Leaf, Bird, Bug, FlaskConical, Users, BarChart3, Zap
} from 'lucide-react';
import useAuthStore from '../store/authStore';

function AnimatedCounter({ end, label, icon: Icon, delay }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 2000;
      const step = end / (duration / 16);
      const interval = setInterval(() => {
        start += step;
        if (start >= end) {
          setCount(end);
          clearInterval(interval);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [end, delay]);

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ animation: `counterFadeIn 0.6s ease ${delay}ms both` }}
    >
      <Icon className="h-5 w-5 text-cyan-400" />
      <span className="text-3xl font-bold text-white">{count.toLocaleString()}+</span>
      <span className="text-xs uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

function FloatingOrb({ size, color, top, left, delay }) {
  return (
    <div
      className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        top,
        left,
        animation: `orbFloat ${8 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'researcher' ? '/researcher' : '/citizen');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050510]">
      {/* Background orbs */}
      <FloatingOrb size="600px" color="#22d3ee" top="-200px" left="-100px" delay={0} />
      <FloatingOrb size="500px" color="#a855f7" top="50%" left="70%" delay={2} />
      <FloatingOrb size="400px" color="#3b82f6" top="70%" left="10%" delay={4} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              CitSci<span className="text-cyan-400">Net</span>
            </h1>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">
              Citizen Science Network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-400 backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>Real-time AI-Powered Observations</span>
        </div>

        <h2
          className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl"
          style={{ animation: 'fadeSlideIn 0.8s ease both' }}
        >
          Help Scientists{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Discover
          </span>
          <br />
          the Natural World
        </h2>

        <p
          className="mb-10 max-w-2xl text-lg leading-relaxed text-white/50"
          style={{ animation: 'fadeSlideIn 0.8s ease 200ms both' }}
        >
          Join a global network of citizen scientists. Upload observations,
          let AI identify species in real-time, and contribute to missions
          that drive real research — all from your phone.
        </p>

        <div
          className="flex gap-4"
          style={{ animation: 'fadeSlideIn 0.8s ease 400ms both' }}
        >
          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:brightness-110"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-medium text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
          >
            <FlaskConical className="h-4 w-4 text-purple-400" />
            Researcher Login
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section
        className="relative z-10 mx-auto flex max-w-3xl items-center justify-around rounded-2xl border border-white/10 bg-white/5 px-8 py-8 backdrop-blur-md"
        style={{ animation: 'fadeSlideIn 0.8s ease 600ms both' }}
      >
        <AnimatedCounter end={12400} label="Observations" icon={BarChart3} delay={800} />
        <div className="h-10 w-px bg-white/10" />
        <AnimatedCounter end={320} label="Active Missions" icon={Target} delay={1000} />
        <div className="h-10 w-px bg-white/10" />
        <AnimatedCounter end={2800} label="Species Found" icon={Leaf} delay={1200} />
        <div className="h-10 w-px bg-white/10" />
        <AnimatedCounter end={5600} label="Scientists" icon={Users} delay={1400} />
      </section>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          {
            icon: Map,
            title: 'Live Map',
            desc: 'See real-time observations pinned on a satellite map with category-coded markers and mission zones.',
            color: '#22d3ee',
            delay: 200,
          },
          {
            icon: Sparkles,
            title: 'AI Detection',
            desc: 'Upload a photo and MobileNet instantly identifies the species — matched against your selected category.',
            color: '#a855f7',
            delay: 400,
          },
          {
            icon: Target,
            title: 'Mission Zones',
            desc: 'Researchers draw geofenced mission areas. Enter the zone, collect data, and earn bounty points.',
            color: '#3b82f6',
            delay: 600,
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            style={{ animation: `fadeSlideIn 0.8s ease ${feature.delay + 800}ms both` }}
          >
            {/* Glow corner */}
            <div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ backgroundColor: feature.color }}
            />

            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${feature.color}15` }}
            >
              <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
            </div>

            <h3 className="mb-2 text-lg font-bold text-white">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Floating species icons */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {[Bird, Bug, Leaf, Microscope].map((Icon, i) => (
          <Icon
            key={i}
            className="absolute text-white/[0.04]"
            style={{
              width: 60 + i * 20,
              height: 60 + i * 20,
              top: `${15 + i * 22}%`,
              left: `${80 + (i % 2 === 0 ? -5 : 5)}%`,
              animation: `floatSlow ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-white/20">
        CitSciNet v1.0 • Built for Hackathon 2026
      </footer>
    </div>
  );
}
