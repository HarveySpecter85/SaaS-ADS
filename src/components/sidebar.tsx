import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { UserNav } from "./user-nav";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  active?: boolean;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: "Home",
    active: true,
  },
  {
    name: "Nano Banana",
    href: "/nano-banana",
    icon: "Sparkles",
    comingSoon: true,
  },
  {
    name: "Gemini Core",
    href: "/gemini-core",
    icon: "Brain",
    comingSoon: true,
  },
  {
    name: "Tracking",
    href: "/tracking",
    icon: "Shield",
    comingSoon: true,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: "LayoutGrid",
    comingSoon: true,
  },
];

// Simple icon components (avoiding external dependencies)
function getIcon(name: string) {
  const iconClass = "w-5 h-5";

  switch (name) {
    case "Home":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "Sparkles":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    case "Brain":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
        </svg>
      );
    case "Shield":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "LayoutGrid":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
    default:
      return null;
  }
}

export async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-slate-200 bg-slate-50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-slate-900">
            AdOrchestrator
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>

      {/* User Nav at bottom */}
      {user?.email && <UserNav email={user.email} />}
    </aside>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const baseClasses =
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group";

  if (item.comingSoon) {
    return (
      <div
        className={`${baseClasses} text-slate-400 cursor-not-allowed`}
        title="Coming Soon"
      >
        {getIcon(item.icon)}
        <span>{item.name}</span>
        <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${baseClasses} ${
        item.active
          ? "bg-white text-slate-900 shadow-sm border-l-2 border-blue-500 -ml-px pl-[calc(0.75rem+1px)]"
          : "text-slate-600 hover:text-slate-900 hover:bg-white"
      }`}
    >
      {getIcon(item.icon)}
      <span>{item.name}</span>
    </Link>
  );
}
