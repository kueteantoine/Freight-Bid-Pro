"use client";

import React from "react";
import { Package, Truck, Users, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  { title: "Shippers", icon: Package, desc: "Post loads and award bids easily." },
  { title: "Carriers", icon: Truck, desc: "Grow your fleet and find new loads." },
  { title: "Drivers", icon: Users, desc: "Accept jobs and navigate via mobile." },
  { title: "Brokers", icon: BarChart3, desc: "Manage networks and earn commissions." },
];

export function LandingRoles() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Built for Every Stakeholder</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
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
  );
}