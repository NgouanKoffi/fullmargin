// src/pages/course/course-public/CourseSidebar.tsx
import type { CourseSaved } from "../CourseTypes";
import { PaymentCard } from "./PaymentCard";
import { CourseStatsCard } from "./CourseStatsCard";

type Props = {
  course: CourseSaved;
  priceText: string;
  displayRating: number;
  totalReviews: number;
  enrolled: boolean;
  playerHref: string;
  isBusy: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  modulesCount: number;
  lessonsCount: number;
  primaryCtaLabel: string;
  onPrimaryCtaClick: () => Promise<void> | void;
};

export function CourseSidebar({
  course,
  priceText,
  displayRating,
  totalReviews,
  enrolled,
  playerHref,
  isBusy,
  isOwner,
  isAdmin,
  modulesCount,
  lessonsCount,
  primaryCtaLabel,
  onPrimaryCtaClick,
}: Props) {
  return (
    <aside className="lg:col-span-1 lg:sticky lg:top-20 h-max space-y-6">
      <PaymentCard
        course={course}
        priceText={priceText}
        displayRating={displayRating}
        totalReviews={totalReviews}
        enrolled={enrolled}
        playerHref={playerHref}
        isBusy={isBusy}
        isOwner={isOwner}
        isAdmin={isAdmin}
        primaryCtaLabel={primaryCtaLabel}
        onPrimaryCtaClick={onPrimaryCtaClick}
      />

      <CourseStatsCard
        modulesCount={modulesCount}
        lessonsCount={lessonsCount}
      />
    </aside>
  );
}
