import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForgotPassword } from "@workspace/api-client-react";
import BrandLogo from "@/components/brand-logo";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const forgotMutation = useForgotPassword();
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    forgotMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          setSent(true);
        },
        onError: () => {
          setSent(true); // Always show success to avoid enumeration
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card text-card-foreground border border-border p-8 rounded-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <BrandLogo className="h-20 w-14 object-contain mb-4 cursor-pointer hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-center">Access Recovery</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {sent ? "Recovery protocol initiated" : "Enter your registered email to recover access"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Registered Email</Label>
                        <FormControl>
                          <Input
                            placeholder="agent@organization.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={forgotMutation.isPending}
                    data-testid="button-submit"
                  >
                    {forgotMutation.isPending ? "Initiating..." : "Initiate Recovery"}
                  </Button>
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                If that email is registered, recovery instructions have been transmitted to your inbox.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
          <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
            Return to authentication
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
