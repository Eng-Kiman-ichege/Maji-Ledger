import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Maji Ledger — Prepaid Water Billing & Property Management",
    template: "%s | Maji Ledger",
  },
  description:
    "Maji Ledger enables tenants to buy prepaid water tokens via mobile payment, while giving property owners full visibility into their portfolio.",
  keywords: ["prepaid water", "water token", "billing", "property management", "M-Pesa", "Kenya"],
  openGraph: {
    title: "Maji Ledger",
    description: "Smart prepaid water billing and property management platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
