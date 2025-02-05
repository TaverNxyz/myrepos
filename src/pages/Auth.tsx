
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email !== 'voee178@gmail.com') {
        toast({
          title: "Error",
          description: "Not authorized as owner",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails and password matches owner password, try to create account
      if (signInError) {
        if (password !== "Annahighschool20") {
          throw new Error("Invalid password");
        }

        // Check if owner profile already exists
        const { data: ownerData } = await supabase
          .from('owner_profile')
          .select()
          .eq('email', email)
          .maybeSingle();

        if (ownerData) {
          throw new Error("Account exists but password is incorrect");
        }

        // Try to create new account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            throw new Error("Account exists. Please try signing in instead.");
          }
          throw signUpError;
        }

        // Create owner profile
        const { error: profileError } = await supabase
          .from('owner_profile')
          .insert([{ id: signUpData.user?.id, email }]);

        if (profileError) {
          console.error("Error creating owner profile:", profileError);
          throw profileError;
        }

        toast({
          title: "Success",
          description: "Owner account created successfully",
        });
        navigate("/");
        return;
      }

      // If sign in succeeds, verify owner status
      const { data: verifyOwnerData, error: verifyOwnerError } = await supabase
        .from('owner_profile')
        .select()
        .eq('email', email)
        .maybeSingle();

      if (verifyOwnerError || !verifyOwnerData) {
        await supabase.auth.signOut();
        throw new Error("Not authorized as owner");
      }

      toast({
        title: "Success",
        description: "Successfully signed in as owner",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <video
        id="video-background"
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
      >
        <source
          src="https://cdn.pixabay.com/video/2020/08/27/48420-453832153_large.mp4"
          type="video/mp4"
        />
      </video>
      <Card className="w-full max-w-md glass">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Owner Access Only
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Owner Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
