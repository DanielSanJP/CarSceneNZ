import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | Car Scene NZ",
  description: "Terms and conditions for using the Car Scene NZ platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        </div>
        <p className="text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-NZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            By accessing and using Car Scene NZ (&ldquo;the Platform&rdquo;),
            you accept and agree to be bound by the terms and provision of this
            agreement. If you do not agree to abide by the above, please do not
            use this service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Description of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Car Scene NZ is a social platform designed to connect car
            enthusiasts across New Zealand. The Platform provides services
            including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Virtual garage creation and car showcase functionality</li>
            <li>Event discovery and attendance management</li>
            <li>Car club creation and membership management</li>
            <li>User profiles and social networking features</li>
            <li>Messaging and communication tools</li>
            <li>Leaderboards and community rankings</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. User Accounts and Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            To access certain features of the Platform, you must register for an
            account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              Provide accurate, current, and complete information during
              registration
            </li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and account</li>
            <li>
              Accept responsibility for all activities that occur under your
              account
            </li>
            <li>
              Notify us immediately of any unauthorized use of your account
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. User Content and Conduct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You are solely responsible for the content you post on the Platform.
            You agree not to post content that:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Is illegal, harmful, threatening, abusive, or defamatory</li>
            <li>Infringes on intellectual property rights</li>
            <li>
              Contains spam, advertising, or promotional materials without
              authorization
            </li>
            <li>Impersonates another person or entity</li>
            <li>Contains personal information of others without consent</li>
            <li>Promotes illegal activities or violence</li>
          </ul>
          <p className="mt-4">
            By posting content, you grant Car Scene NZ a non-exclusive,
            royalty-free license to use, display, and distribute your content on
            the Platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Events and Meetings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Car Scene NZ facilitates event discovery and organization but is not
            responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              The safety, legality, or quality of events listed on the Platform
            </li>
            <li>The actions or behavior of event organizers or attendees</li>
            <li>Any damages, injuries, or losses that may occur at events</li>
            <li>Ensuring events comply with local laws and regulations</li>
          </ul>
          <p className="mt-4">
            Users attend events at their own risk and are encouraged to exercise
            caution and good judgment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Privacy and Data Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Your privacy is important to us. Please review our Privacy Policy to
            understand how we collect, use, and protect your information. By
            using the Platform, you consent to the collection and use of your
            information as described in our Privacy Policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Intellectual Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The Platform and its original content, features, and functionality
            are owned by Car Scene NZ and are protected by international
            copyright, trademark, patent, trade secret, and other intellectual
            property laws.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Car Scene NZ shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including without
            limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from your use of the Platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We may terminate or suspend your account and access to the Platform
            immediately, without prior notice or liability, for any reason
            whatsoever, including without limitation if you breach the Terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Governing Law</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            These Terms shall be interpreted and governed by the laws of New
            Zealand. Any disputes relating to these Terms shall be subject to
            the exclusive jurisdiction of the New Zealand courts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>11. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We reserve the right to modify or replace these Terms at any time.
            If a revision is material, we will provide at least 30 days notice
            prior to any new terms taking effect.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12. Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            If you have any questions about these Terms and Conditions, please
            contact us through our contact page or email us at
            support@carscene.co.nz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
