"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Enter a valid email and password (min 8 characters).");
      return;
    }
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/"
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="you@kasilink.local"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="w-full" onClick={handleSignIn} disabled={isSubmitting || !email || !password}>
            Sign in
          </Button>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-800">Seeded demo users</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>resident@kasilink.local</li>
              <li>business@kasilink.local</li>
              <li>driver@kasilink.local</li>
              <li>admin@kasilink.local</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              If sign-in fails, confirm Postgres is running, run migrations + seed, and verify your DATABASE_URL.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-slate-900 underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
