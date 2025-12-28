"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      email,
      redirect: false,
      callbackUrl: "/dashboard"
    });
    setIsSubmitting(false);

    if (!result || result.error) {
      const message =
        result?.error === "CredentialsSignin"
          ? "Sign-in failed. Make sure Postgres is running, DATABASE_URL is correct, and the demo email is seeded."
          : "Sign-in failed. Verify the demo email and that the database is running.";
      setError(message);
      return;
    }

    if (result.url) {
      router.push(result.url);
    }
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
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="w-full" onClick={handleSignIn} disabled={isSubmitting || !email}>
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
            <p className="mt-3 text-xs text-slate-500">
              If sign-in fails, confirm Postgres is running, run migrations + seed, and verify your DATABASE_URL.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
