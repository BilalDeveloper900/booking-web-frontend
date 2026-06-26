import { ClientMessages } from "@/components/screens/client/messages";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function ClientMessagesPage() {
  return (
    <UpgradeGate feature="chat">
      <ClientMessages />
    </UpgradeGate>
  );
}
