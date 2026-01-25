import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-xl border-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold text-primary">Welcome to FreightBid</CardTitle>
        <p className="text-sm text-center text-muted-foreground">Sign in to access your multi-role dashboard.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
            Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}