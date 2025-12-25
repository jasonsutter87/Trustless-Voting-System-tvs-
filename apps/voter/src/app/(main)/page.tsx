"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon, KeyIcon, AlertCircleIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateCredential } from "@/lib/actions/voting";

export default function Home() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      // Validate credential format
      const result = await validateCredential(credential);

      if (!result.valid || !result.credential) {
        setError(result.error || "Invalid credential format");
        setIsValidating(false);
        return;
      }

      // Store credential in sessionStorage for use in ballot
      sessionStorage.setItem("votingCredential", credential);

      // Redirect to ballot page
      router.push(`/vote/${result.credential.electionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate credential");
      setIsValidating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheckIcon className="size-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            TVS Voter Portal
          </h1>
          <p className="text-muted-foreground text-lg">
            Secure, private, and transparent voting
          </p>
        </div>

        {/* Credential Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="size-5" />
              Enter Your Voting Credential
            </CardTitle>
            <CardDescription>
              Enter the credential you received via email or downloaded during registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credential">Voting Credential</Label>
                <Input
                  id="credential"
                  type="text"
                  placeholder="Paste your credential here..."
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your credential is a JSON string containing your encrypted voting token.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!credential || isValidating}
              >
                {isValidating ? "Validating..." : "Continue to Ballot"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldCheckIcon className="size-4" />
                Security & Privacy
              </h3>
              <ul className="space-y-2 list-disc list-inside">
                <li>Your vote is encrypted before submission</li>
                <li>Your credential ensures one vote per person</li>
                <li>Your vote cannot be linked to your identity</li>
                <li>All votes are recorded in a tamper-proof ledger</li>
                <li>You will receive a confirmation code to verify your vote</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
