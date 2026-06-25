import { Link, useLocation } from "react-router-dom";
import { Package, Calculator, Shuffle, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  // viewTransition só nas páginas leves — nas pesadas (Inventário/Matching) o
  // render síncrono congela a tela e a transição vira demora perceptível.
  const tabs = [
    {
      name: "Sistema de Inventário",
      path: "/",
      icon: Package,
      viewTransition: false,
    },
    {
      name: "Calculadora de Taxas",
      path: "/calculator",
      icon: Calculator,
      viewTransition: true,
    },
    {
      name: "Precificação",
      path: "/pricing",
      icon: Tag,
      viewTransition: true,
    },
    {
      name: "Matching",
      path: "/matching",
      icon: Shuffle,
      badge: "BETA",
      viewTransition: false,
    },
    {
      name: "Seal Care & Shield",
      path: "/seal-care-shield",
      icon: ShieldCheck,
      viewTransition: true,
    },
  ];

  return (
    <nav className="border-b border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                viewTransition={tab.viewTransition}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative",
                  "hover:text-primary",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>
                  {tab.name}
                  {tab.badge && (
                    <sup className="ml-1 text-[10px] font-bold text-primary/80">({tab.badge})</sup>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
