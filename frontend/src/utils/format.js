export function formatBytes(bytes = 0) {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exp;

  return (exp === 0 ? value : value.toFixed(1)) + " " + units[exp];
}

export function formatDate(iso) {
  if (!iso || Number.isNaN(new Date(iso).getTime())) {
    return "—";
  }

  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function extFromName(name = "") {
  const parts = name.split(".");

  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}
