import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_blue_and_white_digital_network_security_background.png';
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data.email, data.password);
      
      // Store token and user in localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      toast({ title: "Login successful", description: `Welcome back, ${response.user.name}!` });
      
      // Redirect to previously attempted route or dashboard
      const returnTo = localStorage.getItem('auth_return_to') || '/dashboard';
      localStorage.removeItem('auth_return_to');
      setLocation(returnTo);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <span className="text-2xl font-bold font-display tracking-tight text-slate-900">KYClytics</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
              Welcome back
            </h1>
            <p className="text-slate-500">
              Enter your credentials to access the compliance portal.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@company.com" {...field} className="h-11 bg-slate-50" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base" data-testid="button-login" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in to Dashboard"}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Demo Credentials
              </span>
            </div>
          </div>
          
          <div className="text-center text-sm text-slate-500">
            <p>Email: admin@kyclytics.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
        <img 
          src={generatedImage} 
          alt="Security Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end p-12">
          <div className="text-white space-y-4 max-w-lg">
            <h2 className="text-3xl font-bold font-display">Automated Risk Intelligence</h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              Streamline your compliance workflow with real-time risk scoring, automated scheduling, and comprehensive audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
