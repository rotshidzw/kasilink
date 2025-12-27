"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="you@kasilink.local"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button className="w-full" onClick={() => signIn("credentials", { email, callbackUrl: "/dashboard" })}>
            Continue
          </Button>
          <div className="text-sm text-slate-600">
            <p>Seeded demo users:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>resident@kasilink.local</li>
              <li>youth@kasilink.local</li>
              <li>business@kasilink.local</li>
              <li>admin@kasilink.local</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
