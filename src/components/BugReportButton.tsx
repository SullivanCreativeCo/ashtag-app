import { useState } from "react";
import { Bug, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const bugReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Please describe the bug in at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
});

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const handleSubmit = async () => {
    const validation = bugReportSchema.safeParse({ description });

    if (!validation.success) {
      toast({
        title: "Invalid input",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-bug-report", {
        body: {
          description: validation.data.description,
          userEmail: user?.email,
          userName: profile?.display_name,
          currentPage: window.location.pathname,
          userAgent: navigator.userAgent,
        },
      });

      if (error) throw error;

      toast({
        title: "Bug report sent!",
        description: "Thanks for helping us improve the app.",
      });

      setDescription("");
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to send bug report:", error);
      toast({
        title: "Failed to send report",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        variant="outline"
        className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-background border-border hover:bg-muted"
        aria-label="Report a bug"
      >
        <Bug className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Report a Bug
            </DialogTitle>
            <DialogDescription>
              Found something that doesn't work right? Let us know!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe the bug... What happened? What did you expect to happen?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? "Sending..." : "Send Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
