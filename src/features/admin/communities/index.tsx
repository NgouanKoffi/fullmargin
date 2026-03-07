// src/features/admin/communities/index.tsx
import { Loader2, ShieldAlert, Users, GraduationCap, AlertTriangle, MessageSquareText, Trash2, RefreshCw } from "lucide-react";
import { useAdminCommunities } from "./useAdminCommunities";
import { TabButton } from "./components/TabButton";
import { Toolbar } from "./components/Toolbar";
import { EmptyState } from "./components/EmptyState";
import { CommunityListItem } from "./components/CommunityListItem";
import { ToastBanner } from "./components/ToastBanner";
import { SuspendModal } from "./components/SuspendModal";
import { WarningModal } from "./components/WarningModal";
import { ConfirmModal } from "./components/ConfirmModal";

export default function AdminCommunautePage() {
  const ctx = useAdminCommunities();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* HEADER */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-skin-base flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-violet-600" />
          Modération Communautaire
        </h1>
        <p className="text-sm text-skin-muted">
          Supervisez l'ensemble des communautés et des formations créées sur la plateforme.
        </p>
      </header>

      {/* TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-skin-border/30 no-scrollbar">
        <TabButton active={ctx.tab === "communities"} onClick={() => ctx.setTab("communities")} icon={Users} label="Communautés" />
        <TabButton active={ctx.tab === "courses"}     onClick={() => ctx.setTab("courses")}     icon={GraduationCap} label="Formations" />
        <TabButton active={ctx.tab === "requests"}    onClick={() => ctx.setTab("requests")}    icon={AlertTriangle} label="Demandes de suppression" />
      </div>

      {/* CONTENT */}
      <main className="bg-skin-surface rounded-2xl ring-1 ring-skin-border/20 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <Toolbar
          tab={ctx.tab}
          searchQuery={ctx.searchQuery}  setSearchQuery={ctx.setSearchQuery}
          dateFrom={ctx.dateFrom}        setDateFrom={ctx.setDateFrom}
          dateTo={ctx.dateTo}            setDateTo={ctx.setDateTo}
          minCount={ctx.minCount}        setMinCount={ctx.setMinCount}
          hasFilters={ctx.hasFilters}    clearFilters={ctx.clearFilters}
        />

        <div className="p-4 sm:p-5 bg-skin-inset/10 flex-1">
          {ctx.loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-skin-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
              <p>Chargement des données...</p>
            </div>

          ) : ctx.tab === "communities" || ctx.tab === "requests" ? (
            <div className="space-y-3">
              {ctx.filteredCommunities.length === 0 ? (
                <EmptyState label="Aucune communauté ne correspond à vos critères." icon={Users} />
              ) : (
                ctx.filteredCommunities.map((c) => (
                  <CommunityListItem
                    key={c.id || String(c._id)}
                    title={c.name}
                    subtitle={`Gérée par ${c.owner?.fullName || "Inconnu"}`}
                    email={c.owner?.email}
                    date={c.createdAt || new Date().toISOString()}
                    imageUrl={c.logoUrl}
                    icon={Users}
                    viewUrl={`/communaute/${c.slug}`}
                    status={c.status}
                    deletedAt={c.deletedAt}
                    warningCount={c.warningCount}
                    stats={[
                      { label: "Membres", value: c.membersCount || 0, icon: Users },
                      { label: "Posts",   value: c.postsCount   || 0, icon: MessageSquareText },
                    ]}
                    onDelete={() => ctx.openSuspendModal(c.id || String(c._id), "Communauté", c.name)}
                    onWarning={() => ctx.openWarningModal(c.id || String(c._id), c.name)}
                    onApproveDeletion={() => ctx.setApproveDeletionModal({ open: true, community: c, loading: false })}
                    onApproveRestoration={() => ctx.setApproveRestorationModal({ open: true, community: c, loading: false })}
                  />
                ))
              )}
            </div>

          ) : (
            <div className="space-y-3">
              {ctx.filteredCourses.length === 0 ? (
                <EmptyState label="Aucune formation ne correspond à vos critères." icon={GraduationCap} />
              ) : (
                ctx.filteredCourses.map((c) => (
                  <CommunityListItem
                    key={c.id}
                    title={c.title}
                    subtitle={`Créée par ${c.ownerName || "Inconnu"} • ${c.priceType === "paid" ? "Payant" : "Gratuit"}`}
                    email={c.ownerEmail || c.owner?.email}
                    date={c.createdAt}
                    imageUrl={c.coverUrl}
                    icon={GraduationCap}
                    viewUrl={c.communitySlug ? `/communaute/formation/${c.id}` : "#"}
                    stats={[{ label: "Inscrits", value: c.enrollmentCount || 0, icon: Users }]}
                    onDelete={() => ctx.openSuspendModal(c.id, "Formation", c.title)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── MODALS ── */}
      <SuspendModal
        open={ctx.suspendModal.open}
        type={ctx.suspendModal.type}
        title={ctx.suspendModal.title}
        loading={ctx.suspendModal.loading}
        onConfirm={ctx.handleSuspendConfirm}
        onCancel={ctx.closeSuspendModal}
      />

      <WarningModal
        open={ctx.warningModal.open}
        title={ctx.warningModal.title}
        loading={ctx.warningModal.loading}
        onConfirm={ctx.handleWarningConfirm}
        onCancel={ctx.closeWarningModal}
      />

      <ConfirmModal
        open={ctx.approveDeletionModal.open}
        title="Approuver la suppression"
        description={`Vous allez supprimer définitivement la communauté "${ctx.approveDeletionModal.community?.name}". Le propriétaire sera notifié. Cette action est irréversible.`}
        confirmLabel="Approuver la suppression"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        icon={Trash2}
        loading={ctx.approveDeletionModal.loading}
        onConfirm={ctx.handleApproveDeletion}
        onCancel={() => ctx.setApproveDeletionModal({ open: false, community: null, loading: false })}
      />

      <ConfirmModal
        open={ctx.approveRestorationModal.open}
        title="Approuver la restauration"
        description={`Vous allez restaurer la communauté "${ctx.approveRestorationModal.community?.name}". Elle redeviendra visible et active.`}
        confirmLabel="Restaurer la communauté"
        confirmClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        icon={RefreshCw}
        loading={ctx.approveRestorationModal.loading}
        onConfirm={ctx.handleApproveRestoration}
        onCancel={() => ctx.setApproveRestorationModal({ open: false, community: null, loading: false })}
      />

      {/* ── TOASTS ── */}
      <ToastBanner toasts={ctx.toasts} onRemove={ctx.removeToast} />
    </div>
  );
}
