import logo from "@/assets/logo";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-lg py-12 md:py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="The Harvesters Logo" className="h-10 w-8 object-contain opacity-90" />
              <span className="text-lg font-bold tracking-tight text-foreground/90">
                CyberCultX
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              An elite enterprise platform by The Harvesters Company. Transforming human risk into measurable intelligence through behavioral analytics and proactive threat simulation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Culture Intelligence</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Behavioral AI</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Phishing Simulation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Executive Insights</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} The Harvesters Company. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
