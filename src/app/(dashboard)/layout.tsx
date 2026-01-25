import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b shadow-sm bg-card">
        <h1 className="text-xl font-semibold text-primary">Freight Bidding Marketplace</h1>
      </header>
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}