import type { Section } from "../types";

interface Props {
  value: Section;
  onChange: (section: Section) => void;
}

export function CategoryTabs({ value, onChange }: Props) {
  return (
    <div className="tabs" role="tablist">
      <button
        role="tab"
        aria-selected={value === "addons"}
        className={value === "addons" ? "tab tab--active" : "tab"}
        onClick={() => onChange("addons")}
      >
        Add-ons
      </button>
      <button
        role="tab"
        aria-selected={value === "maps"}
        className={value === "maps" ? "tab tab--active" : "tab"}
        onClick={() => onChange("maps")}
      >
        Maps
      </button>
    </div>
  );
}
