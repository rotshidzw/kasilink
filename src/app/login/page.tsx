"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.ok) {
      router.push("/dashboard");
      return;
    }

    setError("Sign-in failed. Confirm your database is running and the email exists.");
  };

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
          <Button className="w-full" onClick={handleSignIn} disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Continue"}
          </Button>
          {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
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
