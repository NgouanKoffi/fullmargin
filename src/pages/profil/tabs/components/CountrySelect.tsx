// src/pages/profil/tabs/components/CountrySelect.tsx
import { useMemo } from "react";
import Select, { components } from "react-select";
import type {
  GroupBase,
  MenuListProps,
  OptionProps,
  StylesConfig,
  SingleValue,
} from "react-select";
import countryList from "react-select-country-list";
import type { CountryCode } from "libphonenumber-js/core";
import type { CountryOption } from "react-select-country-list";
import "../about-tab.css";
import getFlagEmoji from "../../utils/getFlagEmoji";

type Props = {
  value?: CountryCode | undefined;
  onChange: (val: CountryCode | undefined) => void;
  placeholder?: string;
};

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Sélectionner un pays",
}: Props) {
  // Full list once, memoized
  const options: CountryOption[] = useMemo(() => countryList().getData(), []);
  const selected = value
    ? options.find((o) => o.value === (value as string)) ?? null
    : null;

  // Styles typés (plus de `any`)
  const styles: StylesConfig<
    CountryOption,
    false,
    GroupBase<CountryOption>
  > = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        borderRadius: 12,
        minHeight: 44,
        paddingInline: 8,
        backgroundColor: "var(--field-bg)",
        color: "var(--field-fg)",
        borderColor: state.isFocused
          ? "var(--field-ring)"
          : "var(--field-border)",
        boxShadow: "none",
        ":hover": {
          borderColor: state.isFocused
            ? "var(--field-ring)"
            : "var(--field-border-hover)",
        },
      }),
      valueContainer: (b) => ({ ...b, paddingBlock: 4 }),
      placeholder: (b) => ({ ...b, color: "var(--field-placeholder)" }),
      singleValue: (b) => ({ ...b, color: "var(--field-fg)" }),
      input: (b) => ({ ...b, color: "var(--field-fg)" }),
      menuPortal: (b) => ({ ...b, zIndex: 60 }),
      menu: (base) => ({
        ...base,
        backgroundColor: "var(--menu-bg)",
        color: "var(--field-fg)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--menu-shadow)",
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused
          ? "var(--option-hover)"
          : "transparent",
        color: "var(--field-fg)",
        cursor: "pointer",
      }),
    }),
    []
  );

  // Custom option: flag + label
  const Option = (props: OptionProps<CountryOption, false>) => (
    <components.Option {...props}>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="text-base leading-none">
          {getFlagEmoji(props.data.value)}
        </span>
        <span>{props.data.label}</span>
      </span>
    </components.Option>
  );

  // Keep default MenuList but enforce a comfy max-height
  const MenuList = (
    props: MenuListProps<CountryOption, false, GroupBase<CountryOption>>
  ) => (
    <components.MenuList {...props}>
      <div style={{ maxHeight: 300, overflowY: "auto" }}>{props.children}</div>
    </components.MenuList>
  );

  return (
    <Select
      classNamePrefix="rs-country"
      instanceId="country-select"
      menuPortalTarget={
        typeof document !== "undefined" ? document.body : undefined
      }
      menuPosition="fixed"
      options={options}
      styles={styles}
      value={selected}
      onChange={(opt: SingleValue<CountryOption>) =>
        onChange((opt?.value as CountryCode) || undefined)
      }
      placeholder={placeholder}
      components={{ MenuList, Option }}
      menuShouldScrollIntoView={false}
      filterOption={(opt, input) =>
        opt.label.toLowerCase().includes(input.toLowerCase())
      }
    />
  );
}
