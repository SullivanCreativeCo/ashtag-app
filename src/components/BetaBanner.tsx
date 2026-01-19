import { X, Sparkles } from "lucide-react";
import { useState } from "react";

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mx-3 mb-4 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-charcoal-dark via-charcoal to-charcoal-dark">
      {/* Subtle gold shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
      
      <div className="relative px-4 py-4">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 rounded-lg bg-primary/20 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-display text-sm font-semibold text-primary">
              Beta Ends January 31st
            </h3>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Rate a cigar and upload a photo before the deadline to earn{" "}
              <span className="text-foreground font-medium">free lifetime access</span>{" "}
              to AshTag. Thank you for being an early tester!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
