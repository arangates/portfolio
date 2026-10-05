"use client";

import {
  AppWindow,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BellRing,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  CircleHelp,
  Code2,
  Coins,
  Database,
  FileClock,
  Fingerprint,
  Flag,
  GitBranch,
  Globe2,
  History,
  Eye,
  KeyRound,
  Layers3,
  Lightbulb,
  Mail,
  MessageCircleMore,
  Rocket,
  Receipt,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TriangleAlert,
  UsersRound,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Children, isValidElement, useId, useState, type ReactNode } from "react";

const iconMap = {
  AppWindow,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BellRing,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  CircleHelp,
  Code2,
  Coins,
  Database,
  FileClock,
  Fingerprint,
  Flag,
  GitBranch,
  Globe2,
  History,
  Eye,
  KeyRound,
  Layers3,
  Lightbulb,
  Mail,
  MessageCircleMore,
  Rocket,
  Receipt,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TriangleAlert,
  UsersRound,
  Wallet,
  WalletCards,
} satisfies Record<string, LucideIcon>;

type IconName = keyof typeof iconMap;

function Icon({ name, className }: { name: IconName; className?: string }) {
  const IconComponent = iconMap[name];
  return <IconComponent aria-hidden="true" className={className} strokeWidth={2.35} />;
}

export function ShowcaseSection({
  children,
  className = "",
  description,
  icon = "Sparkles",
  id,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  icon?: IconName;
  id?: string;
  title: string;
}) {
  return (
    <section className={`docs-showcase ${className}`} id={id}>
      <header className="docs-showcase__header">
        <Icon name={icon} className="docs-showcase__title-icon" />
        <h2>{title}</h2>
        {id ? (
          <a className="docs-showcase__anchor" href={`#${id}`} aria-label={`Link to ${title}`}>
            <ArrowUpRight aria-hidden="true" />
          </a>
        ) : null}
      </header>
      {description ? <p className="docs-showcase__description">{description}</p> : null}
      <div className="docs-showcase__body">{children}</div>
    </section>
  );
}

export function ShowcaseGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`docs-showcase-grid ${className}`}>{children}</div>;
}

const tones = ["violet", "blue", "emerald", "rose", "amber", "cyan"] as const;
type Tone = (typeof tones)[number];

export function ShowcaseCard({
  className = "",
  description,
  href,
  icon,
  title,
  tone = "violet",
}: {
  className?: string;
  description?: ReactNode;
  href: string;
  icon: IconName;
  title: string;
  tone?: Tone;
}) {
  return (
    <a className={`docs-art-card docs-art-card--${tone} ${className}`} href={href}>
      <span className="docs-art-card__scene" aria-hidden="true">
        <span className="docs-art-card__icon">
          <Icon name={icon} />
        </span>
      </span>
      <span className="docs-art-card__copy">
        <span className="docs-art-card__title">{title}</span>
        {description ? <span className="docs-art-card__description">{description}</span> : null}
        <ArrowUpRight className="docs-art-card__arrow" aria-hidden="true" />
      </span>
    </a>
  );
}

export function IconCardGrid({
  children,
  className = "",
  columns = 2,
  surface = false,
}: {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
  surface?: boolean;
}) {
  return (
    <div
      className={`docs-icon-grid docs-icon-grid--${columns}${surface ? " docs-icon-grid--surface" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function IconCard({
  className = "",
  description,
  href,
  icon,
  title,
}: {
  className?: string;
  description?: ReactNode;
  href?: string;
  icon: IconName;
  title: string;
}) {
  const content = (
    <>
      <span className="docs-icon-card__icon">
        <Icon name={icon} />
      </span>
      <span className="docs-icon-card__copy">
        <span className="docs-icon-card__title">{title}</span>
        {description ? <span className="docs-icon-card__description">{description}</span> : null}
      </span>
      {href ? <ArrowUpRight className="docs-icon-card__arrow" aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    return (
      <a className={`docs-icon-card docs-icon-card--link ${className}`} href={href}>
        {content}
      </a>
    );
  }

  return <article className={`docs-icon-card ${className}`}>{content}</article>;
}

const panelTones = ["neutral", "tip", "info", "warning", "danger"] as const;
type PanelTone = (typeof panelTones)[number];

const toneIcon: Record<PanelTone, IconName> = {
  neutral: "Lightbulb",
  tip: "BadgeCheck",
  info: "CircleHelp",
  warning: "CircleHelp",
  danger: "ShieldCheck",
};

export function InfoPanel({
  children,
  className = "",
  icon,
  title,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  icon?: IconName;
  title: string;
  tone?: PanelTone;
}) {
  return (
    <aside className={`docs-info-panel docs-info-panel--${tone} ${className}`}>
      <div className="docs-info-panel__header">
        <Icon name={icon ?? toneIcon[tone]} />
        <h3>{title}</h3>
      </div>
      <div className="docs-info-panel__body">{children}</div>
    </aside>
  );
}

type StepProps = { children: ReactNode; title: string };

export function Steps({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ol className={`docs-steps ${className}`}>{children}</ol>;
}

export function Step({ children, title }: StepProps) {
  return (
    <li className="docs-step">
      <span className="docs-step__number" aria-hidden="true" />
      <div className="docs-step__content">
        <h3>{title}</h3>
        <div>{children}</div>
      </div>
    </li>
  );
}

type TabProps = { children: ReactNode; icon?: IconName; value: string };

export function Tabs({
  children,
  className = "",
  defaultValue,
  label,
}: {
  children: ReactNode;
  className?: string;
  defaultValue?: string;
  label?: string;
}) {
  const panels = Children.toArray(children).filter(
    isValidElement,
  ) as React.ReactElement<TabProps>[];
  const [active, setActive] = useState(defaultValue ?? panels[0]?.props.value ?? "");
  const current = panels.find((panel) => panel.props.value === active) ?? panels[0];
  const idPrefix = useId().replaceAll(":", "");
  const tabId = (value: string) =>
    `${idPrefix}-tab-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className={`docs-tabs ${className}`}>
      <div className="docs-tabs__bar" role="tablist" aria-label={label ?? "Options"}>
        {panels.map((panel) => {
          const { icon, value } = panel.props;
          const selected = value === active;
          return (
            <button
              key={value}
              type="button"
              id={tabId(value)}
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabId(value)}-panel`}
              tabIndex={selected ? 0 : -1}
              className={`docs-tabs__tab${selected ? " is-active" : ""}`}
              onClick={() => setActive(value)}
              onKeyDown={(event) => {
                const currentIndex = panels.findIndex((entry) => entry.props.value === value);
                let nextIndex = currentIndex;

                if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % panels.length;
                if (event.key === "ArrowLeft")
                  nextIndex = (currentIndex - 1 + panels.length) % panels.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = panels.length - 1;

                if (nextIndex !== currentIndex) {
                  event.preventDefault();
                  const nextValue = panels[nextIndex]?.props.value;
                  if (nextValue) {
                    setActive(nextValue);
                    document.getElementById(tabId(nextValue))?.focus();
                  }
                }
              }}
            >
              {icon ? <Icon name={icon} /> : <Layers3 aria-hidden="true" />}
              {value}
            </button>
          );
        })}
      </div>
      {current ? (
        <div
          className="docs-tabs__panel"
          role="tabpanel"
          id={`${tabId(current.props.value)}-panel`}
          aria-labelledby={tabId(current.props.value)}
          tabIndex={0}
        >
          {current.props.children}
        </div>
      ) : null}
    </section>
  );
}

export function Tab({ children, value }: TabProps) {
  return <div data-doc-tab={value}>{children}</div>;
}
