export function isAdministrator(user) {
  return user?.rol === "administrador";
}

export function homeForUser(user) {
  return isAdministrator(user) ? "/" : "/datos-inmuebles";
}
