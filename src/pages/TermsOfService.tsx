import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        <p className="text-muted-foreground">Last updated: January 12, 2026</p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using the AshTag application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Eligibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must be at least 21 years of age to use this App. By using the App, you represent and warrant that you meet this age requirement. This App is intended for legal tobacco consumers only.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Account Registration</h2>
          <p className="text-muted-foreground leading-relaxed">
            To access certain features of the App, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. User Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of any content you submit to the App, including reviews, photos, and comments. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">5. Prohibited Conduct</h2>
          <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Use the App for any unlawful purpose</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to gain unauthorized access to the App or its systems</li>
            <li>Use the App to promote the sale of tobacco products to minors</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The App and its original content, features, and functionality are owned by AshTag and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">7. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the fullest extent permitted by law, AshTag shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">9. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to terminate or suspend your account and access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">10. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">11. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms, please contact us at <a href="mailto:keegan@sullivancreative.co" className="text-primary hover:underline">keegan@sullivancreative.co</a>.
          </p>
        </section>

        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2026 AshTag. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
