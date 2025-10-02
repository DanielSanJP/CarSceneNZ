import { ContactForm } from "@/components/contact-form";
import { ContactInfo, ContactFAQ } from "@/components/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Contact Us | Car Scene NZ",
  description:
    "Get in touch with the Car Scene NZ team for support, partnerships, or general inquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a question, suggestion, or need help? We&apos;d love to hear from
          you. Our team is here to help you get the most out of Car Scene NZ.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <ContactForm />
        <div className="flex flex-col gap-6 h-full">
          <ContactInfo />
          <ContactFAQ />
        </div>
      </div>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            When contacting us or participating in our community, please keep
            these guidelines in mind:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
            <li>Be respectful and courteous in all communications</li>
            <li>
              Provide clear and detailed information when reporting issues
            </li>
            <li>
              Respect privacy and confidentiality of other community members
            </li>
            <li>Use appropriate language and maintain a friendly tone</li>
            <li>Be patient - our team will respond as quickly as possible</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            For urgent safety concerns or inappropriate content, please email us
            directly at support@carscene.co.nz with &ldquo;URGENT&rdquo; in the
            subject line.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
