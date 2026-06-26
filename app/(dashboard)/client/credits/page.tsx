import { ClientCredits } from "@/components/screens/client/credits";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function ClientCreditsPage() {
  return (
    <UpgradeGate feature="credits">
      <ClientCredits />
    </UpgradeGate>
  );
}
