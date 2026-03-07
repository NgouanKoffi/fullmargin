// src/auth/ui/TermsNote.tsx
export default function TermsNote() {
    return (
      <p className="mt-3 text-[11px] leading-snug text-skin-muted text-center">
        En créant un compte, tu acceptes nos{" "}
        <a href="/conditions" className="underline hover:no-underline">Conditions</a> et notre{" "}
        <a href="/confidentialite" className="underline hover:no-underline">Politique de confidentialité</a>.
      </p>
    );
  }  