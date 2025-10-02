import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Car Scene NZ",
  description:
    "Privacy policy detailing how Car Scene NZ collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
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
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Car Scene NZ (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
            &ldquo;us&rdquo;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our platform.
          </p>
          <p>
            By using Car Scene NZ, you consent to the data practices described
            in this policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Personal Information</h4>
            <p className="mb-2">
              We collect the following personal information when you register
              and use our platform:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Email address (required for account creation)</li>
              <li>Username and display name</li>
              <li>Profile images you choose to upload</li>
              <li>
                Social media profile links (Instagram, Facebook, TikTok) if
                provided
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Vehicle Information</h4>
            <p className="mb-2">
              When you create entries in your virtual garage, we collect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Vehicle make, model, and year</li>
              <li>Vehicle modifications and specifications</li>
              <li>Images of your vehicles</li>
              <li>Performance data and technical details</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Activity Data</h4>
            <p className="mb-2">
              We collect information about your platform activity:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Events you create, attend, or express interest in</li>
              <li>Club memberships and roles</li>
              <li>Messages and communications with other users</li>
              <li>Likes, follows, and other social interactions</li>
              <li>Last seen status for inbox functionality</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Location Information</h4>
            <p className="mb-2">We collect location data when:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You create events and specify event locations</li>
              <li>You join clubs with specific regional focus</li>
              <li>
                You voluntarily provide location information in your profile
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>To provide and maintain our platform services</li>
            <li>To facilitate connections between car enthusiasts</li>
            <li>To enable event discovery and attendance management</li>
            <li>To support club creation and membership features</li>
            <li>To enable messaging and communication between users</li>
            <li>To display leaderboards and community rankings</li>
            <li>To send important service notifications and updates</li>
            <li>To improve our platform based on usage patterns</li>
            <li>To ensure platform security and prevent misuse</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information Sharing and Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Public Information</h4>
            <p>The following information is visible to other platform users:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your username, display name, and profile image</li>
              <li>Your vehicle information and garage content</li>
              <li>Events you create or publicly attend</li>
              <li>Club memberships (where applicable)</li>
              <li>Social media links you choose to share</li>
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Private Information</h4>
            <p>We do not share the following without your explicit consent:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your email address</li>
              <li>Private messages between users</li>
              <li>Exact location data beyond what you voluntarily share</li>
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Third-Party Sharing</h4>
            <p>
              We may share information with third parties only in these
              circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect the rights and safety of our users</li>
              <li>
                With service providers who assist in platform operations (under
                strict confidentiality agreements)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Storage and Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction.
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Data is stored in secure, encrypted databases</li>
            <li>
              Access to personal information is limited to authorized personnel
            </li>
            <li>We use industry-standard security protocols</li>
            <li>Regular security audits and updates are performed</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the internet or electronic
            storage is 100% secure. While we strive to protect your information,
            we cannot guarantee its absolute security.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Privacy Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Access:</strong> Request a copy of the personal
              information we hold about you
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or
              incomplete information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal
              information (subject to legal requirements)
            </li>
            <li>
              <strong>Portability:</strong> Request your data in a portable
              format
            </li>
            <li>
              <strong>Objection:</strong> Object to certain processing of your
              information
            </li>
            <li>
              <strong>Withdrawal:</strong> Withdraw consent for data processing
              where consent was given
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us through our contact page
            or email support@carscene.co.nz.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookies and Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We use cookies and similar tracking technologies to improve your
            experience on our platform:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Essential cookies for platform functionality</li>
            <li>Analytics cookies to understand usage patterns</li>
            <li>Preference cookies to remember your settings</li>
          </ul>
          <p className="mt-4">
            You can control cookie settings through your browser, though
            disabling certain cookies may affect platform functionality.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Children&apos;s Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Our platform is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13. If we become aware that we have collected personal information
            from a child under 13, we will take steps to delete such
            information.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>International Data Transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Your information may be transferred to and processed in countries
            other than New Zealand. When we transfer your information
            internationally, we ensure appropriate safeguards are in place to
            protect your privacy rights.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the &ldquo;Last updated&rdquo; date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
