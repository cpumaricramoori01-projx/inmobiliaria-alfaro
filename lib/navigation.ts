export const dashboardMenuItem = { href: "/", label: "Panel de control", icon: "dashboard" };

// Menu links and page headings share these exact names.
export const menuGroups = [
  {
    label: "Operación",
    items: [
      { href: "/cartera", label: "Cartera de inmuebles", icon: "home" },
      { href: "/registrar-inmueble", label: "Registrar inmueble", icon: "plus" },
    ],
  },
  {
    label: "Seguimiento",
    items: [
      { href: "/registrar-visitas", label: "Registrar visitas", icon: "visit" },
      { href: "/visitas-pendientes", label: "Visitas pendientes", icon: "clock" },
      { href: "/registrar-tasaciones", label: "Registrar tasaciones", icon: "valuation" },
      { href: "/tasaciones-textos-pendientes", label: "Tasaciones y textos", icon: "clipboard" },
    ],
  },
  {
    label: "Cierre e información",
    items: [
      { href: "/liberar-inmuebles", label: "Liberar inmueble", icon: "release" },
      { href: "/reportes", label: "Reportes", icon: "report" },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/usuarios", label: "Usuarios y accesos", icon: "users" },
      { href: "/seguridad", label: "Registro de seguridad", icon: "clipboard" },
    ],
  },
  {
    label: "Información de inmuebles",
    items: [{ href: "/datos-inmuebles", label: "Ficha, documentos y fotos", icon: "database" }],
  },
];
