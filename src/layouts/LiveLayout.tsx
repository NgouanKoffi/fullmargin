// src/layouts/LiveLayout.tsx
import useAnalytics from "../hooks/useAnalytics";
import LiveRoomPage from "../pages/direct/LiveRoomPage";

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
