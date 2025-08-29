export default [
  {
    label: "Guides",
    autogenerate: {
      directory: "guides",
    },
  },
  {
    label: "Labs",
    autogenerate: {
      directory: "labs",
    },
  },
  {
    label: "Assignments",
    autogenerate: {
      directory: "assignments",
    },
  },
  {
    label: "External Resources",
    autogenerate: {
      directory: "resources",
    },
  },
] as const;
