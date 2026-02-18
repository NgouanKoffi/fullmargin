import SummaryCard from "./security/SummaryCard";
import TwoFactorCard from "./security/TwoFactorCard";
import PasswordCard from "./security/PasswordCard";
import LinkedAccountsCard from "./security/LinkedAccountsCard";

export default function SecurityTab({
  isGoogleLinked,
  localEnabled,
  twoFAEnabled,
}: {
  isGoogleLinked: boolean;
  localEnabled: boolean;
  twoFAEnabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <SummaryCard
        isGoogleLinked={isGoogleLinked}
        localEnabled={localEnabled}
        twoFAEnabled={twoFAEnabled}
      />

      <TwoFactorCard
        isGoogleLinked={isGoogleLinked}
        twoFAEnabled={twoFAEnabled}
      />

      {!isGoogleLinked && localEnabled && <PasswordCard />}

      <LinkedAccountsCard isGoogleLinked={isGoogleLinked} />
    </div>
  );
}