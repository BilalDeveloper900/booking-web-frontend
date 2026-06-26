import { OwnerMessages } from "@/components/screens/owner/messages";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function OwnerMessagesPage() {
  return (
    <UpgradeGate feature="chat">
      <OwnerMessages />
    </UpgradeGate>
  );
}
