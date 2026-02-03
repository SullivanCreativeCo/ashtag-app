import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Crown, 
  Lock, 
  Bell, 
  ShoppingBag, 
  Users, 
  Send,
  Gift,
  Calendar,
  CreditCard,
  Megaphone,
  Package,
  TrendingUp,
  Eye,
  Plus,
  ChevronRight,
  Sparkles,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DemoView = "locked" | "member" | "admin";

// Mock data for demo
const mockLounge = {
  name: "Social Cigar Lounge",
  logo: null,
  memberSince: "January 2024",
  membershipExpires: "January 2025",
  memberNumber: "SCL-2847",
};

const mockDeals = [
  {
    id: "1",
    title: "Member Monday Special",
    description: "20% off all Padron cigars",
    validUntil: "Every Monday",
    image: null,
  },
  {
    id: "2", 
    title: "Weekend Bundle",
    description: "Buy 4 get 1 free on house sticks",
    validUntil: "Sat & Sun only",
    image: null,
  },
  {
    id: "3",
    title: "Birthday Bonus",
    description: "Free premium cigar during your birthday month",
    validUntil: "Your birthday month",
    image: null,
  },
];

const mockNotifications = [
  {
    id: "1",
    title: "New Arrivals!",
    message: "We just got a shipment of Opus X. Limited supply!",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "Event Reminder",
    message: "Whiskey & Cigar pairing event this Saturday at 7pm",
    time: "1 day ago",
    read: true,
  },
];

const mockProducts = [
  {
    id: "1",
    name: "House Blend Toro",
    price: 12.00,
    inStock: true,
  },
  {
    id: "2",
    name: "Monthly Sampler Pack",
    price: 45.00,
    inStock: true,
  },
  {
    id: "3",
    name: "Premium Cutter Set",
    price: 85.00,
    inStock: false,
  },
];

export default function Club() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [demoView, setDemoView] = useState<DemoView>("locked");
  const [showDemoToggle, setShowDemoToggle] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(!!data);
      setIsCheckingAdmin(false);
    };
    checkAdmin();
  }, [user]);
  
  // Lead capture form state
  const [loungeName, setLoungeName] = useState("");
  const [loungeLocation, setLoungeLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission - in production this would go to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Request submitted! We'll reach out to your lounge soon.");
    setLoungeName("");
    setLoungeLocation("");
    setContactEmail("");
    setMessage("");
    setIsSubmitting(false);
  };

  // Show Coming Soon for non-admins
  if (!isCheckingAdmin && !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Crown className="h-10 w-10 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary border-0">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
          <h1 className="font-display text-3xl font-semibold mb-3">
            Members Club
          </h1>
          <p className="text-muted-foreground font-body max-w-sm mb-8">
            Exclusive deals, notifications, and perks from your favorite cigar lounge — all in one place. Stay tuned!
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {[
              { icon: Gift, label: "Exclusive Deals" },
              { icon: Bell, label: "Push Alerts" },
              { icon: ShoppingBag, label: "Easy Ordering" },
              { icon: CreditCard, label: "Membership" },
            ].map((feature) => (
              <div 
                key={feature.label}
                className="card-glass p-4 opacity-60"
              >
                <feature.icon className="h-5 w-5 text-primary mb-2 mx-auto" />
                <p className="font-display text-sm font-medium">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 -mx-1 px-5 py-5 header-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-widest mb-1">
                Exclusive Access
              </p>
              <h1 className="font-display text-3xl font-semibold text-foreground flex items-center gap-2">
                Members Club
                <Crown className="h-6 w-6 text-primary" />
              </h1>
            </div>
          </div>

          {/* Demo Toggle - for sales pitches */}
          {showDemoToggle && (
            <div className="mt-4 p-3 rounded-xl bg-charcoal-light/50 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary font-medium uppercase tracking-wider flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Demo Mode
                </span>
                <button 
                  onClick={() => setShowDemoToggle(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Hide
                </button>
              </div>
              <div className="flex gap-2">
                {(["locked", "member", "admin"] as DemoView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setDemoView(view)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all capitalize",
                      demoView === view
                        ? "bg-primary text-primary-foreground"
                        : "bg-charcoal text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4">
          {/* Locked View - For non-members */}
          {demoView === "locked" && (
            <div className="space-y-6">
              {/* Hero locked state */}
              <div className="card-glass p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-charcoal-light flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold mb-2">
                    Members Only
                  </h2>
                  <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto">
                    Exclusive deals, notifications, and perks from your favorite cigar lounge — all in one place.
                  </p>
                </div>
              </div>

              {/* Feature preview cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Gift, label: "Exclusive Deals", desc: "Member-only pricing" },
                  { icon: Bell, label: "Push Alerts", desc: "New arrivals & events" },
                  { icon: ShoppingBag, label: "Easy Ordering", desc: "Reserve for pickup" },
                  { icon: CreditCard, label: "Renew Membership", desc: "One-tap renewal" },
                ].map((feature) => (
                  <div 
                    key={feature.label}
                    className="card-glass p-4 opacity-60"
                  >
                    <feature.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="font-display text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Lead capture form */}
              <div className="card-glass p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">
                    Don't see your lounge?
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Let us know which cigar lounge you'd like to see on AshTag. We'll reach out to them!
                </p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="loungeName" className="text-xs text-muted-foreground">
                      Lounge Name
                    </Label>
                    <Input
                      id="loungeName"
                      value={loungeName}
                      onChange={(e) => setLoungeName(e.target.value)}
                      placeholder="Social Cigar Lounge"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="loungeLocation" className="text-xs text-muted-foreground">
                      City / Location
                    </Label>
                    <Input
                      id="loungeLocation"
                      value={loungeLocation}
                      onChange={(e) => setLoungeLocation(e.target.value)}
                      placeholder="Greenville, SC"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" className="text-xs text-muted-foreground">
                      Your Email (optional)
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-xs text-muted-foreground">
                      Message (optional)
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="I'm a member there and would love to see them join!"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Request Your Lounge
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Member View */}
          {demoView === "member" && (
            <div className="space-y-6">
              {/* Membership Card */}
              <div className="card-glass p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Active Member
                      </Badge>
                      <h2 className="font-display text-xl font-semibold">
                        {mockLounge.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Member #{mockLounge.memberNumber}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-charcoal-light flex items-center justify-center">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="text-sm font-medium">{mockLounge.membershipExpires}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-primary/30">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Renew
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Updates
                  </h3>
                  <span className="text-xs text-muted-foreground">2 new</span>
                </div>
                <div className="space-y-2">
                  {mockNotifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={cn(
                        "card-glass p-4",
                        !notif.read && "border-l-2 border-l-primary"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusive Deals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Member Deals
                  </h3>
                </div>
                <div className="space-y-3">
                  {mockDeals.map((deal) => (
                    <div key={deal.id} className="card-glass p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display font-medium">{deal.title}</p>
                          <p className="text-sm text-muted-foreground">{deal.description}</p>
                          <p className="text-xs text-primary mt-1">{deal.validUntil}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Order */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Reserve for Pickup
                  </h3>
                </div>
                <div className="space-y-2">
                  {mockProducts.map((product) => (
                    <div key={product.id} className="card-glass p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-primary font-display">${product.price.toFixed(2)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={product.inStock ? "default" : "outline"}
                        disabled={!product.inStock}
                      >
                        {product.inStock ? "Add" : "Sold Out"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin View */}
          {demoView === "admin" && (
            <div className="space-y-6">
              {/* Admin Header */}
              <div className="card-glass p-5 bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      {mockLounge.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">Lounge Admin Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Members", value: "247", icon: Users },
                  { label: "This Month", value: "$3.2k", icon: TrendingUp },
                  { label: "Pending", value: "12", icon: Package },
                ].map((stat) => (
                  <div key={stat.label} className="card-glass p-4 text-center">
                    <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="font-display text-lg font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold">Quick Actions</h3>
                
                <button className="card-glass p-4 w-full flex items-center justify-between hover:bg-charcoal-light/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Send Push Notification</p>
                      <p className="text-xs text-muted-foreground">Alert all your members</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="card-glass p-4 w-full flex items-center justify-between hover:bg-charcoal-light/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create New Deal</p>
                      <p className="text-xs text-muted-foreground">Offer exclusive member pricing</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="card-glass p-4 w-full flex items-center justify-between hover:bg-charcoal-light/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Manage Products</p>
                      <p className="text-xs text-muted-foreground">Add items for member purchase</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="card-glass p-4 w-full flex items-center justify-between hover:bg-charcoal-light/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Members</p>
                      <p className="text-xs text-muted-foreground">Manage memberships & renewals</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                <button className="card-glass p-4 w-full flex items-center justify-between hover:bg-charcoal-light/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Schedule Event</p>
                      <p className="text-xs text-muted-foreground">Create member-only events</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">Recent Orders</h3>
                <div className="card-glass divide-y divide-border/30">
                  {[
                    { member: "John D.", item: "Monthly Sampler", status: "Ready", time: "10m ago" },
                    { member: "Sarah M.", item: "House Blend x5", status: "Pending", time: "1h ago" },
                    { member: "Mike R.", item: "Premium Cutter", status: "Picked Up", time: "3h ago" },
                  ].map((order, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{order.member}</p>
                        <p className="text-xs text-muted-foreground">{order.item}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            order.status === "Ready" && "bg-green-500/20 text-green-400",
                            order.status === "Pending" && "bg-yellow-500/20 text-yellow-400",
                            order.status === "Picked Up" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{order.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
