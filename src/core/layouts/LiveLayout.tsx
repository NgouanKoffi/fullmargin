import useAnalytics from "@core/analytics/useAnalytics";
import LiveRoomPage from "@features/direct/LiveRoomPage";

export default function LiveLayout() {
  // on garde quand même les stats
  useAnalytics();

  return (
    <div className="w-screen h-[100dvh] bg-black">
      {/* La page de live prend tout l’écran, sans header/footer du site */}
      <LiveRoomPage />
    </div>
  );
}
