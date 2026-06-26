import { OffersScreen } from "@/components/screens/offers-screen";
import { UpgradeGate } from "@/components/upgrade-gate";

export default function OwnerOffersPage() {
  return (
    <UpgradeGate feature="offersBuilder">
      <OffersScreen />
    </UpgradeGate>
  );
}
