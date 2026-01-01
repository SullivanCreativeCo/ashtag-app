import { Check, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CigarMatch {
  cigarId: string;
  brand: string;
  line: string;
  vitola: string;
  confidence: number;
  matchReason: string;
}

interface MatchResult {
  identified: boolean;
  confidence: number;
  extractedInfo: {
    brand: string | null;
    line: string | null;
    otherText: string | null;
  };
  matches: CigarMatch[];
}

interface CigarMatchResultsProps {
  result: MatchResult | null;
  loading: boolean;
  error: string | null;
  capturedImage: string;
  onSelectMatch: (cigarId: string) => void;
  onManualSearch: () => void;
  onRetake: () => void;
}

export function CigarMatchResults({
  result,
  loading,
  error,
  capturedImage,
  onSelectMatch,
  onManualSearch,
  onRetake,
}: CigarMatchResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative mb-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 h-10 w-10 animate-ping opacity-20 rounded-full bg-primary" />
        </div>
        <p className="text-foreground font-medium">Analyzing cigar band...</p>
        <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-foreground font-medium">Recognition Failed</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onRetake}>
            Try Again
          </Button>
          <Button onClick={onManualSearch}>
            Search Manually
          </Button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const hasMatches = result.matches && result.matches.length > 0;
  const topMatch = hasMatches ? result.matches[0] : null;

  return (
    <div className="space-y-4">
      {/* Captured Image Preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <img
          src={capturedImage}
          alt="Captured cigar band"
          className="h-full w-full object-cover"
        />
        {result.identified && topMatch && topMatch.confidence >= 70 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-xs font-medium text-white">
            <Check className="h-3 w-3" />
            {topMatch.confidence}% match
          </div>
        )}
      </div>

      {/* Extracted Info */}
      {result.extractedInfo && (result.extractedInfo.brand || result.extractedInfo.line) && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Detected text:</p>
          <p className="text-sm font-medium text-foreground">
            {[result.extractedInfo.brand, result.extractedInfo.line]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      )}

      {/* Match Results */}
      {hasMatches ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {result.matches.length === 1 ? "Best Match" : "Possible Matches"}
          </p>
          
          {result.matches.slice(0, 3).map((match, index) => (
            <button
              key={match.cigarId}
              onClick={() => onSelectMatch(match.cigarId)}
              className={cn(
                "w-full card-elevated card-press p-4 text-left",
                index === 0 && match.confidence >= 70 && "ring-2 ring-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground">
                    {match.brand} {match.line}
                  </h3>
                  <p className="text-sm text-muted-foreground">{match.vitola}</p>
                  {match.matchReason && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {match.matchReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      match.confidence >= 70
                        ? "text-green-500"
                        : match.confidence >= 40
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {match.confidence}%
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-foreground font-medium">No matches found</p>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn't identify this cigar band
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onRetake} className="flex-1">
          Retake Photo
        </Button>
        <Button onClick={onManualSearch} className="flex-1">
          {hasMatches ? "Not my cigar" : "Search Manually"}
        </Button>
      </div>
    </div>
  );
}
