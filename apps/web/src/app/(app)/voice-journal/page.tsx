import type { Metadata } from "next";
import { VoiceJournal } from "@/features/voice/voice-journal";

export const metadata: Metadata = { title: "Voice journal" };

export default function VoiceJournalPage() {
  return <VoiceJournal />;
}
