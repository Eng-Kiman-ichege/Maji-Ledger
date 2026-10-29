import type { Metadata } from "next";
import PropertiesClient from "./PropertiesClient";

export const metadata: Metadata = {
  title: "Properties | Maji Ledger",
  description: "Manage all properties, buildings, and apartments in your portfolio.",
};

export const instant = false;

export default function PropertiesPage() {
  return <PropertiesClient />;
}
