"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Truck,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const LandingRoles = () => {
  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Join the Ecosystem</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tailored Experiences for Every Logistics Partner.
          </h3>
          <p className="text-lg text-slate-500 font-medium">
            Whether you're shipping industrial goods or managing a national fleet, FreightBid provides the tools to grow your operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <RoleCard
            role="Shipper"
            desc="Optimize your supply chain with transparent bidding and live tracking."
            icon={Package}
            color="text-blue-600"
            bg="bg-blue-50"
            href="/register?role=shipper"
            features={["Live Load Tendering", "Analytics Dashboard"]}
          />
          <RoleCard
            role="Carrier"
            desc="Maximize your fleet utilization and get paid faster than ever."
            icon={Truck}
            color="text-emerald-600"
            bg="bg-emerald-50"
            href="/register?role=carrier"
            features={["Instant Load Matching", "Fleet Management"]}
          />
          <RoleCard
            role="Broker"
            desc="Streamline operations and manage margins with full visibility."
            icon={Briefcase}
            color="text-amber-600"
            bg="bg-amber-50"
            href="/register?role=broker"
            features={["Partner Network Control", "Margin Analytics"]}
          />
          <RoleCard
            role="Driver"
            desc="Simple mobile delivery tasks with digital POD and instant payouts."
            icon={Users}
            color="text-indigo-600"
            bg="bg-indigo-50"
            href="/register?role=driver"
            features={["Mobile-First Dispatch", "Digital POD"]}
          />
        </div>
      </div>
    </section>
  );
};

function RoleCard({ role, desc, icon: Icon, color, bg, href, features }: any) {
  return (
    <div className="group relative">
      <Card className="h-full rounded-[40px] border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden bg-white">
        <CardContent className="p-8 flex flex-col h-full space-y-8">
          <div className={cn("p-6 rounded-3xl w-fit transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", bg)}>
            <Icon className={cn("h-8 w-8", color)} />
          </div>

          <div className="space-y-4">
            <h4 className="text-2xl font-black text-slate-900">{role}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
          </div>

          <div className="space-y-3 flex-1">
            {features.map((f: string) => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{f}</span>
              </div>
            ))}
          </div>

          <Link href={href}>
            <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold group-hover:bg-primary transition-all duration-500 flex items-center justify-between px-6">
              Join as {role}
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-primary/20 rounded-[40px] blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none -z-10"></div>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}