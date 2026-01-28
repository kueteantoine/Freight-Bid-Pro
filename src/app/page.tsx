"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Truck, Shield, Globe, Zap, ArrowRight, Package, Users, BarChart3 } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Truck className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tighter">FreightBid</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-primary/5 to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  The Future of Freight in <span className="text-primary">Cameroon</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Connect Shippers with Carriers through a real-time bidding marketplace. 
                  Streamline logistics, track shipments, and secure payments with Mobile Money.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/register">Ship Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Bidding</h3>
                <p className="text-muted-foreground">
                  Get the best rates through competitive bidding. Carriers compete to move your freight efficiently.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Payments</h3>
                <p className="text-muted-foreground">
                  Integrated with Orange Money and MTN MoMo. Automatic commission handling and itemized receipts.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Tracking</h3>
                <p className="text-muted-foreground">
                  Know exactly where your cargo is. GPS tracking and milestone updates from pickup to delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Built for Every Stakeholder</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Shippers", icon: Package, desc: "Post loads and award bids easily." },
                { title: "Carriers", icon: Truck, desc: "Grow your fleet and find new loads." },
                { title: "Drivers", icon: Users, desc: "Accept jobs and navigate via mobile." },
                { title: "Brokers", icon: BarChart3, desc: "Manage networks and earn commissions." },
              ].map((role) => (
                <div key={role.title} className="bg-background p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group">
                  <role.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-bold mb-2">{role.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{role.desc}</p>
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:h-24 items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 FreightBid. All rights reserved. Central Africa's Logistics Leader.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-sm hover:underline underline-offset-4" href="#">
              Terms
            </Link>
            <Link className="text-sm hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
          </nav>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
}