import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import logo from "@/assets/logo";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1, "Select your role"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", role: "employee" },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data: any) => {
          toast({
            title: "Request submitted",
            description: data.message || "Your account is waiting for super admin approval.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: err.data?.error || err.message || "Registration failed",
          });
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
            <img src={logo} alt="The Harvesters Logo" className="h-20 w-14 object-contain mb-4 cursor-pointer hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-center">Request Clearance</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">Submit your account request for super admin approval</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label>First Name</Label>
                    <FormControl>
                      <Input placeholder="Ahmed" {...field} data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Last Name</Label>
                    <FormControl>
                      <Input placeholder="Al-Rashidi" {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label>Email Address</Label>
                  <FormControl>
                    <Input placeholder="agent@organization.com" {...field} data-testid="input-email" />
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
                  <Label>Passphrase</Label>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <Label>Access Level</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white text-foreground dark:bg-white dark:text-zinc-950" data-testid="select-role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Operative (Employee)</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="hr">HR Officer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Submitting..." : "Submit request"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
          Already have clearance?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
            Authenticate
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
