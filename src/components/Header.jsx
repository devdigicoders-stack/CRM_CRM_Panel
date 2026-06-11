// src/components/Header.jsx
import { memo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

const Header = memo(({ toggleSidebar, currentPageTitle }) => {
  const { themeColors } = useTheme();
  const { currentFont } = useFont();
  const { admin } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return "AD";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b sticky top-0 z-40"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }}
    >
      {/* Left — hamburger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded-lg border transition-all hover:opacity-80"
          style={{
            color: themeColors.text,
            backgroundColor: themeColors.background,
            borderColor: themeColors.border,
          }}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <h2
          className="text-sm font-bold truncate"
          style={{
            color: themeColors.text,
            fontFamily: currentFont.family,
          }}
        >
          {currentPageTitle}
        </h2>
      </div>

      {/* Right — Profile button */}
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-2 px-2 py-0.5 rounded-xl border transition-all hover:opacity-80 shrink-0"
        style={{
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        }}
        title="Go to Profile"
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
          style={{ backgroundColor: themeColors.primary, color: "#fff" }}
        >
          {getInitials(admin?.name)}
        </div>

        {/* Name — hidden on mobile */}
        <div className="hidden sm:block text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider leading-none" style={{ color: themeColors.textSecondary }}>
            CRM Profile
          </p>
          <p className="text-sm font-bold mt-0.5" style={{ color: themeColors.text }}>
            {admin?.name || "Admin"}
          </p>
        </div>
      </button>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
