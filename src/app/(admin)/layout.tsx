import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="p-4 border-b shadow-md bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Admin Panel</h1>
      </header>
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}