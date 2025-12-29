"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAccount, type SignupState } from "@/app/signup/actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction] = useFormState(createAccount, initialState);

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create your KasiLink account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" action={formAction}>
            <Input name="name" placeholder="Full name" required />
            <Input type="email" name="email" placeholder="you@kasilink.local" required />
            <Input name="phone" placeholder="Phone (optional)" />
            <Input type="password" name="password" placeholder="Password" required />
            <Input type="password" name="confirmPassword" placeholder="Confirm password" required />
            {state.error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
            )}
            <Button className="w-full" type="submit">
              Create account
            </Button>
          </form>
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-900 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
