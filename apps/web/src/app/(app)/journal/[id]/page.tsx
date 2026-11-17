import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryEditor } from "@/features/journal/entry-editor";
import { businessDateIn } from "@/lib/utils";

export const metadata: Metadata = { title: "Entry" };

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  return <EntryEditor entryId={id} initialDate={businessDateIn("UTC")} />;
}
