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
//      directory: "labs",
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
    label: "Theory",
    autogenerate: {
      directory: "theory",
    },
  },
] as const;
