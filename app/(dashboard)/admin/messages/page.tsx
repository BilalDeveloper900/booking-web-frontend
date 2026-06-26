import { AdminMessages } from "@/components/screens/admin/messages";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function AdminMessagesPage() {
  return (
    <UpgradeGate feature="chat">
      <AdminMessages />
    </UpgradeGate>
  );
}
