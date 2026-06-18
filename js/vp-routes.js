/**
 * Rutas de la aplicacion (dos URLs)
 */
const VP_ROUTES = {
  login: 'index.html',
  app: 'app.html',
  loginUrl(base) {
    return base ? `${base.replace(/\/?$/, '/')}${this.login}` : this.login;
  },
  appUrl(base) {
    return base ? `${base.replace(/\/?$/, '/')}${this.app}` : this.app;
  }
};
