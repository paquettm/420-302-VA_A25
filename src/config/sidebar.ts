export default [
  {
    label: "Guides",
    autogenerate: {
      directory: "guidesym",
    },
  },
  {
    label: "Labs",
    autogenerate: {
//      directory: "labs",
      directory: "labsym",
    },
  },
  {
    label: "Assignments",
    autogenerate: {
      directory: "assignmentsym",
    },
  },
  {
    label: "Theory",
    autogenerate: {
      directory: "theorysym",
    },
  },
] as const;
