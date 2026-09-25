const paths = {
  shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z M8.5 12l2.5 2.5 4.5-5",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  folder: "M3 7V5h6l2 2h10v13H3V7Z",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  upload: "M12 16V3 M7 8l5-5 5 5 M4 16v5h16v-5",
  download: "M12 3v13 M7 11l5 5 5-5 M4 16v5h16v-5",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  lock: "M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3",
  file: "M5 3h9l5 5v13H5z M14 3v6h5 M8 14h8 M8 17h5",
  clock: "M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  check: "M5 12l4 4L19 6",
  close: "M6 6l12 12 M6 18 18 6",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  logout: "M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  copy: "M9 9h12v12H9z M5 15H3V3h12v2",
  trash: "M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 13-2l2 3 M4 16l2 3a8 8 0 0 0 13-2",
  activity: "M2 12h5l3-8 4 16 3-8h5",
  chevron: "m9 5 7 7-7 7",
  plus: "M12 5v14 M5 12h14",
  alert: "M12 3 2 21h20L12 3Z M12 9v5 M12 17h.01",
};
export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}
