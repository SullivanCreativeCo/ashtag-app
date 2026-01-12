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
        <p className="text-muted-foreground">Last updated: January 12, 2026</p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            AshTag ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Information We Collect</h2>
          
          <h3 className="font-medium">Personal Information</h3>
          <p className="text-muted-foreground leading-relaxed">
            We may collect personal information that you voluntarily provide when registering for an account, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Email address</li>
            <li>Display name</li>
            <li>Profile photo</li>
          </ul>

          <h3 className="font-medium mt-4">Usage Data</h3>
          <p className="text-muted-foreground leading-relaxed">
            We automatically collect certain information when you use the App, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Device information (type, operating system)</li>
            <li>App usage statistics</li>
            <li>Cigar reviews and ratings you create</li>
            <li>Photos you upload</li>
          </ul>

          <h3 className="font-medium mt-4">Location Information</h3>
          <p className="text-muted-foreground leading-relaxed">
            With your consent, we may collect your location data to show nearby cigar lounges and enhance your experience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
          <p className="text-muted-foreground leading-relaxed">We use the collected information to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Provide and maintain the App</li>
            <li>Create and manage your account</li>
            <li>Enable social features (friends, comments, likes)</li>
            <li>Display personalized content and recommendations</li>
            <li>Communicate with you about updates and features</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Protect against unauthorized access and abuse</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Information Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share your information in the following situations:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>With other users:</strong> Your public profile, reviews, and comments are visible to other App users</li>
            <li><strong>Service providers:</strong> We may share information with third-party vendors who assist in operating the App</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect our rights</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">5. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">7. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            The App is not intended for individuals under 21 years of age. We do not knowingly collect personal information from anyone under 21. If we discover that we have collected information from someone under 21, we will delete it immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">9. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            The App may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">10. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">11. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
          </p>
          <p className="text-muted-foreground">
            Email: privacy@ashtag.app
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
