"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Assuming cn utility is available

export const LandingHero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden bg-slate-950">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="flex justify-center">
            <Badge className="bg-white/5 border-white/10 text-primary-foreground font-black text-[10px] uppercase tracking-[0.3em] px-4 py-2 rounded-full backdrop-blur-sm shadow-xl">
              <Zap className="h-3 w-3 mr-2 text-primary fill-primary" />
              Revolutionizing Digital Logistics
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tighter">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Freight Bidding</span> is Here.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Transforming Cameroon's logistics landscape with a transparent, AI-driven bidding marketplace. Connect with verified carriers, optimize routes, and scale your business with ease.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg shadow-[0_0_30px_-5px_rgba(0,122,255,0.4)] hover:shadow-[0_0_40px_-5px_rgba(0,122,255,0.6)] hover:bg-primary/90 transition-all active:scale-95 group">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="ghost" size="lg" className="h-16 px-10 rounded-2xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 group">
              <PlayCircle className="mr-2 h-5 w-5 text-primary" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <TrustStat label="Verified Carriers" value="2.4k+" icon={ShieldCheck} />
            <TrustStat label="Digital Corridors" value="150+" icon={Globe} />
            <TrustStat label="Annual Volume" value="450 Tons" icon={TrendingUp} />
            <TrustStat label="Avg. Savings" value="18%" icon={Zap} />
          </div>
        </div>
      </div>

      {/* Floating UI Elements (Decorative) */}
      <div className="hidden lg:block">
        <FloatingCard
          top="20%"
          left="5%"
          title="New Bid Received"
          value="XAF 1.2M"
          status="Pending Approval"
          delay="0s"
        />
        <FloatingCard
          top="60%"
          right="5%"
          title="Shipment Arrived"
          value="Ref #CM-8812"
          status="Delivery Confirmed"
          delay="1.5s"
          success
        />
      </div>
    </section>
  );
};

function TrustStat({ label, value, icon: Icon }: any) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

function FloatingCard({ top, left, right, title, value, status, delay, success }: any) {
  return (
    <div
      className="absolute bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl animate-bounce-slow"
      style={{ top, left, right, animationDelay: delay }}
    >
      <div className="flex items-center gap-4">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", success ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary")}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white">{title}</h4>
          <p className="text-sm font-bold text-primary">{value}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn("h-1.5 w-1.5 rounded-full", success ? "bg-emerald-500" : "bg-amber-500")}></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}