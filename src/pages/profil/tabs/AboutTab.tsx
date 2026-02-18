// src/pages/profil/tabs/AboutTab.tsx
import { useEffect, useMemo, useState } from "react";
import { notifyError, notifySuccess } from "../../../components/Notification";
import { useAuth } from "../../../auth/AuthContext";
import type { ProfileExtra } from "../types";

/* === Selects & helpers === */
import Select from "react-select";
import type { ClassNamesConfig, StylesConfig } from "react-select";
import countryList from "react-select-country-list";
import CountryFlag from "react-country-flag";
import type { CountryOption } from "react-select-country-list";
import type { CountryCode } from "libphonenumber-js";
import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { City } from "country-state-city";

import { API_BASE } from "../../../lib/api";

/* util */
const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

type PhoneCountryOption = {
  value: CountryCode;
  label: string;
  calling: string;
};
type CityOption = { value: string; label: string };

/* --- petit helper local pour récupérer le token --- */
function getBearer(): string {
  try {
    const raw = localStorage.getItem("fm:session");
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.token) return `Bearer ${s.token}`;
    }
    const t = localStorage.getItem("fm:token");
    return t ? `Bearer ${t}` : "";
  } catch {
    return "";
  }
}

export default function AboutTab({
  extra,
  setExtra,
  userEmail,
  userFullName,
}: {
  extra: ProfileExtra;
  setExtra: React.Dispatch<React.SetStateAction<ProfileExtra>>;
  userEmail?: string;
  userFullName?: string;
}) {
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* -------------------- Chargement initial (préremplissage) -------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API_BASE}/profile/extra`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: getBearer(),
          },
        });
        const data = await r.json().catch(() => null);
        if (!r.ok || !data?.ok || !data.profile) {
          if (mounted) setLoading(false);
          return notifyError(data?.error || "Chargement du profil impossible.");
        }

        const p = data.profile as {
          fullName?: string;
          email?: string;
          phone?: string;
          country?: string;
          city?: string;
          bio?: string;
        };

        if (mounted) {
          // 🔁 MERGE : on n'écrase pas coverUrl/avatarUrl déjà en mémoire
          setExtra((x) => ({
            ...x,
            fullName: p.fullName ?? x.fullName ?? userFullName ?? "",
            phone: p.phone ?? "",
            country: p.country
              ? (p.country.toUpperCase() as CountryCode)
              : undefined,
            city: p.city ?? "",
            bio: p.bio ?? "",
          }));
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          notifyError("Chargement du profil impossible.");
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Pays (profil) -------------------- */
  const countryOptions: CountryOption[] = useMemo(
    () => countryList().getData(),
    []
  );
  const countrySelectClasses: ClassNamesConfig<CountryOption, false> = {
    container: () => "text-sm",
    control: (state) =>
      cx(
        "rounded-xl min-h-11 px-2 ring-1 transition",
        "bg-slate-100 dark:bg-slate-800 ring-skin-border/30",
        state.isFocused && "ring-2 ring-fm-primary/40"
      ),
    valueContainer: () => "gap-2 py-1.5",
    input: () => "text-skin-base",
    singleValue: () => "text-skin-base",
    placeholder: () => "text-skin-muted",
    indicatorsContainer: () => "gap-1",
    dropdownIndicator: () => "text-skin-muted hover:text-skin-base",
    clearIndicator: () => "text-skin-muted hover:text-skin-base",
    indicatorSeparator: () => "hidden",
    menu: () =>
      "mt-1 w-full rounded-xl overflow-hidden shadow-xl ring-1 ring-skin-border/20 z-50 bg-white dark:bg-slate-900",
    menuList: () => "max-h-60 py-1",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) =>
      cx(
        "cursor-pointer px-3 py-2 text-sm",
        isSelected
          ? "bg-fm-primary/15 text-fm-primary-600 dark:text-fm-primary-400"
          : isFocused
          ? "bg-slate-100 dark:bg-slate-700/60"
          : "text-skin-base"
      ),
    noOptionsMessage: () => "px-3 py-2 text-skin-muted",
  };

  /* -------------------- Téléphone (découplé) -------------------- */
  const phoneCountryOptions: PhoneCountryOption[] = useMemo(() => {
    return countryOptions
      .map((o) => {
        try {
          const cc = getCountryCallingCode(o.value as CountryCode);
          return {
            value: o.value as CountryCode,
            label: o.label,
            calling: `+${cc}`,
          };
        } catch {
          return null;
        }
      })
      .filter((x): x is PhoneCountryOption => Boolean(x));
  }, [countryOptions]);

  const initialPhoneCountry: CountryCode = (() => {
    if (extra.phone) {
      const p = parsePhoneNumberFromString(extra.phone);
      if (p?.country) return p.country as CountryCode;
    }
    return "CI" as CountryCode;
  })();

  const [phoneCountry, setPhoneCountry] =
    useState<CountryCode>(initialPhoneCountry);
  const [localPhone, setLocalPhone] = useState<string>("");

  // Quand on reçoit le téléphone du serveur, on met à jour la partie locale
  useEffect(() => {
    if (extra.phone) {
      const p = parsePhoneNumberFromString(extra.phone);
      if (p?.nationalNumber) setLocalPhone(p.nationalNumber.toString());
      if (p?.country) setPhoneCountry(p.country as CountryCode);
    } else {
      setLocalPhone("");
    }
  }, [extra.phone]);

  // Reformatter si on change d'indicatif
  useEffect(() => {
    if (!localPhone) return;
    const fmt = new AsYouType(phoneCountry);
    fmt.input(localPhone.replace(/\D/g, ""));
    const next = fmt.getChars();
    if (next !== localPhone) setLocalPhone(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneCountry]);

  const updateE164 = (digits: string, country: CountryCode) => {
    const cc = getCountryCallingCode(country);
    const e164 = digits ? `+${cc}${digits}` : "";
    setExtra((x) => ({ ...x, phone: e164 }));
  };

  const handleLocalPhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const typer = new AsYouType(phoneCountry);
    const formatted = typer.input(digits);
    setLocalPhone(formatted);
    updateE164(digits, phoneCountry);
  };

  const selectedPhoneOption =
    phoneCountryOptions.find((o) => o.value === phoneCountry) ??
    phoneCountryOptions.find((o) => o.value === "CI");

  /* Préfixe mince : menu/items = uniquement l’indicatif */
  const phonePrefixClasses: ClassNamesConfig<PhoneCountryOption, false> = {
    container: () =>
      "text-sm w-auto min-w-[92px] max-w-[40%] basis-[clamp(92px,32%,150px)] shrink-0",
    control: (state) =>
      cx(
        "rounded-lg min-h-[38px] px-2 transition",
        "bg-slate-200/70 dark:bg-slate-700/70",
        state.isFocused && "ring-2 ring-fm-primary/40"
      ),
    valueContainer: () => "py-1 gap-2",
    singleValue: () => "text-skin-base tabular-nums",
    placeholder: () => "text-skin-muted",
    indicatorsContainer: () => "gap-1",
    dropdownIndicator: () => "opacity-70 hover:opacity-100",
    clearIndicator: () => "hidden",
    indicatorSeparator: () => "hidden",
    menu: () =>
      "mt-1 w-auto min-w-[8rem] rounded-xl overflow-hidden shadow-xl ring-1 ring-skin-border/20 z-50 bg-white dark:bg-slate-900",
    menuList: () => "max-h-60 py-1",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) =>
      cx(
        "cursor-pointer px-3 py-2 text-sm tabular-nums",
        isSelected
          ? "bg-fm-primary/15 text-fm-primary-600 dark:text-fm-primary-400"
          : isFocused
          ? "bg-slate-100 dark:bg-slate-700/60"
          : "text-skin-base"
      ),
  };
  const phonePrefixStyles: StylesConfig<PhoneCountryOption, false> = {
    menu: (base) => ({ ...base, width: "max-content", minWidth: "8rem" }),
  };

  /* -------------------- Villes en fonction du pays -------------------- */
  const citySelectClasses: ClassNamesConfig<CityOption, false> = {
    container: () => "text-sm",
    control: (state) =>
      cx(
        "rounded-xl min-h-11 px-2 ring-1 transition",
        "bg-slate-100 dark:bg-slate-800 ring-skin-border/30",
        state.isFocused && "ring-2 ring-fm-primary/40"
      ),
    valueContainer: () => "gap-2 py-1.5",
    input: () => "text-skin-base",
    singleValue: () => "text-skin-base",
    placeholder: () => "text-skin-muted",
    indicatorsContainer: () => "gap-1",
    dropdownIndicator: () => "text-skin-muted hover:text-skin-base",
    clearIndicator: () => "text-skin-muted hover:text-skin-base",
    indicatorSeparator: () => "hidden",
    menu: () =>
      "mt-1 w-full rounded-xl overflow-hidden shadow-xl ring-1 ring-skin-border/20 z-50 bg-white dark:bg-slate-900",
    menuList: () => "max-h-60 py-1",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) =>
      cx(
        "cursor-pointer px-3 py-2 text-sm",
        isSelected
          ? "bg-fm-primary/15 text-fm-primary-600 dark:text-fm-primary-400"
          : isFocused
          ? "bg-slate-100 dark:bg-slate-700/60"
          : "text-skin-base"
      ),
    noOptionsMessage: () => "px-3 py-2 text-skin-muted",
  };

  const cityOptions: CityOption[] = useMemo(() => {
    if (!extra.country) return [];
    const list = City.getCitiesOfCountry(extra.country as string) || [];
    const seen = new Set<string>();
    const opts: CityOption[] = [];
    for (const c of list) {
      const name = c.name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const label = c.stateCode ? `${name} — ${c.stateCode}` : name;
      opts.push({ value: name, label });
      if (opts.length >= 1000) break;
    }
    return opts.sort((a, b) => a.value.localeCompare(b.value));
  }, [extra.country]);

  /* -------------------- Sauvegarde -------------------- */
  const saveAbout = async () => {
    try {
      setSaving(true);
      const r = await fetch(`${API_BASE}/profile/extra`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBearer(),
        },
        body: JSON.stringify({
          fullName: (extra.fullName || "").trim(),
          phone: (extra.phone || "").trim(),
          country: (extra.country
            ? String(extra.country).toUpperCase()
            : "") as string,
          city: (extra.city || "").trim(),
          bio: (extra.bio || "").trim(),
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.ok || !data.profile) {
        setSaving(false);
        return notifyError(data?.error || "Sauvegarde impossible.");
      }
      const p = data.profile as {
        fullName: string;
        phone: string;
        country?: string;
        city: string;
        bio: string;
      };

      // 🔁 MERGE retour serveur
      setExtra((x) => ({
        ...x,
        fullName: p.fullName || x.fullName,
        phone: p.phone || "",
        country: p.country
          ? (p.country.toUpperCase() as CountryCode)
          : undefined,
        city: p.city || "",
        bio: p.bio || "",
      }));

      // Rafraîchir /auth/me → header à jour tout de suite
      await refresh();

      notifySuccess("Profil mis à jour.");
      setSaving(false);
    } catch {
      setSaving(false);
      notifyError("Sauvegarde impossible.");
    }
  };

  return (
    <div className="rounded-2xl border border-skin-border/60 ring-1 ring-skin-border/30 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-skin-base font-semibold">Informations du profil</h3>

      {loading ? (
        <div className="mt-4 text-sm text-skin-muted">Chargement…</div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom complet */}
            <div>
              <label className="block text-xs text-skin-muted mb-1">
                Nom complet
              </label>
              <input
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-skin-border/30 p-3 text-sm outline-none focus:ring-fm-primary/35"
                placeholder="Ex. N'gouan Emmanuel KOFFI"
                value={extra.fullName}
                onChange={(e) =>
                  setExtra((x) => ({ ...x, fullName: e.target.value }))
                }
              />
            </div>

            {/* Email (grisé + mention) */}
            <div>
              <label className="block text-xs text-skin-muted mb-1">
                Email
              </label>
              <input
                className="w-full rounded-xl p-3 text-sm outline-none cursor-not-allowed
                           bg-slate-100 dark:bg-slate-800
                           text-slate-500 dark:text-slate-400
                           ring-1 ring-skin-border/30"
                value={userEmail || ""}
                disabled
                aria-describedby="email-note"
              />
              <p id="email-note" className="mt-1 text-[11px] text-skin-muted">
                Adresse liée au compte — non modifiable ici.
              </p>
            </div>

            {/* Téléphone — préfixe mince (affiche juste +XYZ) */}
            <div className="md:col-span-1">
              <label className="block text-xs text-skin-muted mb-1">
                Téléphone
              </label>

              <div
                className="
                  flex items-center gap-2 rounded-xl min-h-11 px-2
                  ring-1 ring-skin-border/30 bg-slate-100 dark:bg-slate-800
                  focus-within:ring-2 focus-within:ring-fm-primary/40
                "
              >
                <Select<PhoneCountryOption, false>
                  unstyled
                  classNames={phonePrefixClasses}
                  styles={phonePrefixStyles}
                  menuPosition="fixed"
                  getOptionLabel={(opt) => opt.calling}
                  getOptionValue={(opt) => opt.value}
                  options={phoneCountryOptions}
                  value={selectedPhoneOption || null}
                  onChange={(opt) => {
                    const newCountry = (opt?.value ?? "CI") as CountryCode;
                    setPhoneCountry(newCountry);
                    const digits = localPhone.replace(/\D/g, "");
                    updateE164(digits, newCountry);
                  }}
                  placeholder="+___"
                  formatOptionLabel={(opt) => (
                    <span className="flex items-center gap-2">
                      <CountryFlag
                        svg
                        countryCode={opt.value}
                        style={{ width: "1.1em", height: "1.1em" }}
                      />
                      <span className="tabular-nums">{opt.calling}</span>
                    </span>
                  )}
                />

                {/* Saisie locale — compressible */}
                <input
                  inputMode="numeric"
                  placeholder="XX XX XX XX"
                  className="min-w-0 flex-1 bg-transparent text-skin-base placeholder:text-skin-muted outline-none py-2 px-1 text-sm"
                  value={localPhone}
                  onChange={(e) => handleLocalPhoneChange(e.target.value)}
                />
              </div>

              {extra.phone && (
                <p className="mt-1 text-[11px] text-skin-muted">
                  Stocké en E.164 :{" "}
                  <span className="tabular-nums">{extra.phone}</span>
                </p>
              )}
            </div>

            {/* Pays (profil) */}
            <div className="md:col-span-1">
              <label className="block text-xs text-skin-muted mb-1">Pays</label>
              <Select<CountryOption, false>
                unstyled
                instanceId="country-select"
                classNames={countrySelectClasses}
                menuPosition="fixed"
                options={countryOptions}
                value={
                  extra.country
                    ? countryOptions.find(
                        (o) => o.value === (extra.country as string)
                      ) ?? null
                    : null
                }
                onChange={(opt) =>
                  setExtra((x) => ({
                    ...x,
                    country: opt ? (opt.value as CountryCode) : undefined,
                    city: "", // reset ville quand le pays change
                  }))
                }
                placeholder="Sélectionner un pays"
                formatOptionLabel={(opt) => (
                  <span className="flex items-center gap-2">
                    <CountryFlag
                      svg
                      countryCode={opt.value}
                      style={{ width: "1.1em", height: "1.1em" }}
                    />
                    <span>{opt.label}</span>
                  </span>
                )}
                isClearable
              />
            </div>

            {/* Ville — liste dépend du pays */}
            <div className="md:col-span-2">
              <label className="block text-xs text-skin-muted mb-1">
                Ville
              </label>
              <Select<CityOption, false>
                unstyled
                instanceId="city-select"
                classNames={citySelectClasses}
                menuPosition="fixed"
                isDisabled={!extra.country}
                options={cityOptions}
                value={
                  extra.city
                    ? cityOptions.find((o) => o.value === extra.city) ?? null
                    : null
                }
                onChange={(opt) =>
                  setExtra((x) => ({ ...x, city: opt ? opt.value : "" }))
                }
                placeholder={
                  extra.country
                    ? "Sélectionner une ville"
                    : "Choisis d'abord un pays"
                }
                noOptionsMessage={() =>
                  extra.country ? "Aucune ville" : "Choisis un pays"
                }
              />
            </div>

            {/* À propos */}
            <div className="md:col-span-2">
              <label className="block text-xs text-skin-muted mb-1">
                À propos
              </label>
              <textarea
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-skin-border/30 p-3 text-sm outline-none focus:ring-fm-primary/35 min-h-[110px]"
                placeholder="Présente-toi en quelques lignes…"
                value={extra.bio}
                onChange={(e) =>
                  setExtra((x) => ({ ...x, bio: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={saveAbout}
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/25 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() =>
                setExtra((x) => ({
                  ...x,
                  fullName: userFullName || "",
                  phone: "",
                  bio: "",
                  country: undefined,
                  city: "",
                }))
              }
              className="rounded-full px-4 py-2 text-sm ring-1 ring-skin-border/25 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Réinitialiser
            </button>
          </div>
        </>
      )}
    </div>
  );
}
