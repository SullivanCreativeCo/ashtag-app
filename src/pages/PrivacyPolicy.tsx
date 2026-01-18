import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        <p className="text-muted-foreground leading-relaxed">
          AshTag respects your privacy. We collect only what we need to make the app work and we never sell your personal data.
        </p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may collect the following information when you use AshTag:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Name and email address</li>
            <li>Account login information</li>
            <li>App usage data such as features used and interactions</li>
            <li>Optional profile information you choose to share</li>
            <li>Device and basic analytics data to improve performance</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            We do not collect sensitive personal data unless you voluntarily provide it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">We use your information to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Create and manage your account</li>
            <li>Operate and improve the AshTag app</li>
            <li>Communicate with you about updates or support requests</li>
            <li>Maintain security and prevent misuse</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed font-medium">
            We do not sell your data. Period.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            AshTag may use trusted third-party tools for analytics, hosting, authentication, or email delivery. These services only receive the minimum data needed to perform their function and are required to keep it secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We take reasonable steps to protect your data using modern security practices. No system is perfect, but we actively work to safeguard your information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Your Choices</h2>
          <p className="text-muted-foreground leading-relaxed">You can:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Update or delete your account information</li>
            <li>Request account deletion</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            To make a request, email <a href="mailto:apps@keegareauxlabs.com" className="text-primary hover:underline">apps@keegareauxlabs.com</a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            AshTag is not intended for users under the age of 13. We do not knowingly collect data from children.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. If we do, we will update the date at the top of the page.
          </p>
        </section>

        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2026 AshTag. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
