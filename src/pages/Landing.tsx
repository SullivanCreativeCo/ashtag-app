import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Flame, Users, Camera, Star, ArrowRight } from "lucide-react";
import logo from "@/assets/ashtag-logo-new.png";
import appScreenshot from "@/assets/app-screenshot-feed.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Snap & Identify",
      description: "Photograph any cigar band and let AI identify it instantly from our database."
    },
    {
      icon: Star,
      title: "Rate & Remember",
      description: "Log your smokes with detailed ratings on flavor, construction, burn, and strength."
    },
    {
      icon: Users,
      title: "Connect & Share",
      description: "Follow fellow aficionados, share your experiences, and discover what the community is enjoying."
    }
  ];

  const stats = [
    { value: "500+", label: "Cigar Profiles" },
    { value: "Social", label: "Community" },
    { value: "Free", label: "To Use" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 header-blur border-b border-border/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AshTag" className="h-10 w-auto" />
            <span className="font-display text-xl text-primary">AshTag</span>
          </div>
          <Button 
            onClick={() => navigate("/feed")}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm text-primary font-medium">Sign Up</span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
                <span className="text-primary">AshTag.</span>
                <br />
                <span className="text-foreground text-2xl md:text-3xl lg:text-4xl">
                  Smoke It. Rate It. Share It. Remember It.
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Explore <span className="text-primary font-medium">500+ detailed cigar profiles</span>, 
                track your humidor, and share reviews with fellow enthusiasts. 
                Use the web app or download the free iOS app.
              </p>

              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => navigate("/feed")}
                  size="lg"
                  className="btn-glow text-primary-foreground font-semibold px-8 w-fit"
                >
                  Use the Web App <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-3 opacity-40 pointer-events-none">
                    <img 
                      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                      alt="Download on the App Store" 
                      className="h-12"
                    />
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                      alt="Get it on Google Play" 
                      className="h-12"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                </div>
              </div>
            </div>

            {/* Right - Phone mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-[280px] md:w-[320px]">
                {/* Phone frame */}
                <div className="relative rounded-[40px] border-[8px] border-charcoal-light bg-charcoal overflow-hidden shadow-float">
                  {/* Phone screen content - real screenshot */}
                  <div className="aspect-[9/19] bg-background overflow-hidden">
                    <img 
                      src={appScreenshot} 
                      alt="AshTag App Feed" 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                
                {/* Glow effects */}
                <div className="absolute -inset-8 rounded-full bg-primary/25 blur-3xl -z-10" />
                <div className="absolute -inset-16 rounded-full bg-primary/15 blur-[80px] -z-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-6xl">
          <div className="card-glass p-8 md:p-12 space-y-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl mb-4">
                Everything You Need to{" "}
                <span className="text-primary">Elevate</span> Your Cigar Experience
              </h2>
              <p className="text-muted-foreground text-lg">
                Discover cigars that match your taste, keep your collection organized, 
                and see what the community is enjoying. AshTag keeps your cigar life in one place.
              </p>
            </div>


            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="card-leather p-6 space-y-4 group hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="font-display text-3xl md:text-4xl">
            Built for <span className="text-primary">Newcomers</span> and <span className="text-primary">Seasoned</span> Smokers Alike
          </h2>
          <p className="text-xl text-muted-foreground">
            Join the Community
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {["A Curated Collection", "Built by the Community", "Smart Recommendations"].map((tag) => (
              <div key={tag} className="badge-gold">
                <Flame className="h-3 w-3" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl">
          <div className="card-cinematic p-8 md:p-12 text-center space-y-6 glow-gold">
            <h2 className="font-display text-3xl md:text-4xl">
              For the Ones Worth <span className="text-primary">Remembering</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Keep a record of every cigar you'd light again.
            </p>
            <Button 
              onClick={() => navigate("/feed")}
              size="lg"
              className="btn-glow text-primary-foreground font-semibold px-12"
            >
              Log Your First Cigar <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AshTag" className="h-8 w-auto" />
              <span className="font-display text-lg text-primary">AshTag</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AshTag. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
