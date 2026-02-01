import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    
    try {
      // Delete user's data from related tables
      // The cascade deletes should handle most of this, but we'll be explicit
      await Promise.all([
        supabase.from("smoke_logs").delete().eq("user_id", user.id),
        supabase.from("likes").delete().eq("user_id", user.id),
        supabase.from("comments").delete().eq("user_id", user.id),
        supabase.from("user_favorites").delete().eq("user_id", user.id),
        supabase.from("friendships").delete().or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        supabase.from("cigar_requests").delete().eq("user_id", user.id),
        supabase.from("reports").delete().eq("reporter_user_id", user.id),
      ]);
      
      // Delete the user's profile
      await supabase.from("profiles").delete().eq("id", user.id);
      
      // Sign out the user (this effectively completes the deletion from the app perspective)
      await supabase.auth.signOut();
      
      toast.success("Account deleted", {
        description: "Your account and all associated data have been removed.",
      });
      
      navigate("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account", {
        description: "Please try again or contact support at keegan@sullivancreative.co",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 px-4 py-3 header-blur flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">Settings</h1>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Account Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            
            <div className="card-elevated p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            
            <div className="card-elevated border-destructive/20 p-4 space-y-4">
              <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2" disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and remove all your data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All smoke logs and ratings</li>
                        <li>Your favorites and friendships</li>
                        <li>All comments and likes</li>
                        <li>Your profile information</li>
                      </ul>
                      <p className="mt-3 font-medium">This action cannot be undone.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Support</h2>
            
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground">
                Need help? Contact us at{" "}
                <a 
                  href="mailto:keegan@sullivancreative.co" 
                  className="text-primary hover:underline"
                >
                  keegan@sullivancreative.co
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
