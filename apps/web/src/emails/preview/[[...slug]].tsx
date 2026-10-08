"use client";

import { useState, useEffect } from "react";
import { NotificationEmailPreview } from "../templates/NotificationEmail";
import { TestEmailPreview } from "../templates/TestEmail";
import { WelcomeEmailPreview } from "../templates/WelcomeEmail";
import { BillsEmailPreview } from "../templates/BillsEmail";
import { ContractsEmailPreview } from "../templates/ContractsEmail";
import { DepositsEmailPreview } from "../templates/DepositsEmail";
import { InvestmentsEmailPreview } from "../templates/InvestmentsEmail";

// Preview components for development
export default function EmailPreviewPage({ params }: { params: { slug?: string[] } }) {
  const [selectedTemplate, setSelectedTemplate] = useState("notification");
  const [emailContent, setEmailContent] = useState<React.ReactElement | null>(null);

  // Available email templates for preview
  const templates: Record<string, { name: string; component: React.ReactElement }> = {
    notification: {
      name: "Notification Email",
      component: <NotificationEmailPreview />,
    },
    test: {
      name: "Test Email",
      component: <TestEmailPreview />,
    },
    welcome: {
      name: "Welcome Email",
      component: <WelcomeEmailPreview />,
    },
    bills: {
      name: "Bills Email",
      component: <BillsEmailPreview />,
    },
    contracts: {
      name: "Contracts Email",
      component: <ContractsEmailPreview />,
    },
    deposits: {
      name: "Deposits Email",
      component: <DepositsEmailPreview />,
    },
    investments: {
      name: "Investments Email",
      component: <InvestmentsEmailPreview />,
    },
  };

  useEffect(() => {
    // Set the initial template based on URL slug
    if (params.slug && params.slug.length > 0) {
      const template = params.slug[0];
      if (templates[template]) {
        setSelectedTemplate(template);
      }
    }
  }, [params.slug]);

  useEffect(() => {
    // Render the selected template
    setEmailContent(templates[selectedTemplate]?.component || null);
  }, [selectedTemplate]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">React Email Preview</h1>
        <p className="text-gray-600 mb-8">
          Preview your email templates in the browser. These templates use @react-email/components
          for server-side rendering.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Template</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(templates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTemplate === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {templates[selectedTemplate]?.name || "No template selected"}
            </h2>
          </div>

          <div className="p-6">
            {emailContent ? (
              <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                <div className="bg-white max-w-4xl mx-auto rounded-md shadow-lg overflow-hidden">
                  {/* Simulate email client iframe */}
                  <div className="p-1">
                    <div className="border border-gray-300 rounded-md overflow-auto max-h-[800px]">
                      {emailContent}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>
                    This is a preview of the HTML email template. In production, this will be
                    rendered and sent via Resend.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Select a template from above to preview it.</p>
                <p className="text-sm text-gray-400">
                  Available templates: {Object.keys(templates).join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Development Notes</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Installation:</strong> Run{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                pnpm add @react-email/components @react-email/render @react-email/tailwind
              </code>
            </p>
            <p>
              <strong>Usage:</strong> Import email templates from{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">@/emails</code> and use the email
              services to send emails.
            </p>
            <p>
              <strong>Preview:</strong> Access this page at{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">/emails/preview</code> to preview all
              templates.
            </p>
            <p>
              <strong>Production:</strong> Templates are automatically rendered to HTML when sent
              via the email service functions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
