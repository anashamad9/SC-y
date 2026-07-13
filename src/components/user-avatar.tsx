import { useState } from "react";
import { cn } from "@/lib/utils";

const ROLE_GRADIENTS: Record<string, string> = {
  Employee: "from-blue-600 to-blue-800",
  employee: "from-blue-600 to-blue-800",
  Executive: "from-primary to-red-900",
  executive: "from-primary to-red-900",
  HR: "from-purple-600 to-purple-800",
  hr: "from-purple-600 to-purple-800",
  Admin: "from-orange-600 to-orange-800",
  admin: "from-orange-600 to-orange-800",
  SuperAdmin: "from-primary to-red-900",
  superadmin: "from-primary to-red-900",
};

function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "?";
}

function usableAvatarUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) return null;
  return url;
}

export default function UserAvatar({
  user,
  role = "Employee",
  className = "h-9 w-9",
  fallbackClassName,
}: {
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  role?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = usableAvatarUrl(user?.avatarUrl);
  const label = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        onError={() => setImageFailed(true)}
        className={cn(
          "shrink-0 rounded-full border border-border bg-background object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
        ROLE_GRADIENTS[user?.role ?? role] ?? ROLE_GRADIENTS.Employee,
        className,
        fallbackClassName,
      )}
      title={label}
    >
      {initials(user?.firstName, user?.lastName)}
    </div>
  );
}
