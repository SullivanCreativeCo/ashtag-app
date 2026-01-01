import { cn } from "@/lib/utils";

interface LitMatchRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LitMatchRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showLabel = false,
}: LitMatchRatingProps) {
  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          disabled={readonly}
          className={cn(
            "transition-all duration-200 focus:outline-none",
            !readonly && "cursor-pointer hover:scale-110 active:scale-95",
            readonly && "cursor-default"
          )}
          aria-label={`Rate ${rating} out of 5`}
        >
          <MatchIcon
            lit={rating <= value}
            className={sizeClasses[size]}
          />
        </button>
      ))}
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface MatchIconProps {
  lit: boolean;
  className?: string;
}

function MatchIcon({ lit, className }: MatchIconProps) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("match-icon", className)}
    >
      {/* Match stick body */}
      <rect
        x="10"
        y="12"
        width="4"
        height="18"
        rx="1"
        fill={lit ? "hsl(var(--ember-dark))" : "hsl(var(--match-inactive))"}
      />
      
      {/* Match head */}
      <ellipse
        cx="12"
        cy="11"
        rx="4"
        ry="5"
        fill={lit ? "hsl(var(--ember))" : "hsl(var(--match-inactive))"}
      />
      
      {/* Flame when lit */}
      {lit && (
        <>
          {/* Outer flame glow */}
          <ellipse
            cx="12"
            cy="5"
            rx="5"
            ry="7"
            fill="hsl(var(--ember))"
            opacity="0.3"
            className="animate-pulse-ember"
          />
          {/* Main flame */}
          <path
            d="M12 0C12 0 8 4 8 7C8 9.5 9.5 11 12 11C14.5 11 16 9.5 16 7C16 4 12 0 12 0Z"
            fill="hsl(var(--match-active))"
            className="animate-glow"
          />
          {/* Inner flame */}
          <path
            d="M12 3C12 3 10 5.5 10 7C10 8.5 10.8 9.5 12 9.5C13.2 9.5 14 8.5 14 7C14 5.5 12 3 12 3Z"
            fill="hsl(var(--ember-glow))"
          />
        </>
      )}
    </svg>
  );
}

// Display-only version for showing scores
export function LitMatchDisplay({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const roundedScore = Math.round(score);
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((rating) => (
        <MatchIcon
          key={rating}
          lit={rating <= roundedScore}
          className={sizeClasses[size]}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-foreground">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
