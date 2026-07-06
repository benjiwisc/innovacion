export const ROLES = {
  ADULTO_MAYOR: 'adulto_mayor',
  CUIDADOR: 'cuidador',
  FAMILIA: 'familia',
};

export const roleConfig = {
  [ROLES.ADULTO_MAYOR]: {
    fontScale: 1.4,
    contraste: 'alto',
    nivelDetalleMedicamentos: 'simple',
    mostrarHistorialCompleto: false,
    navegacion: 'simplificada',
  },
  [ROLES.CUIDADOR]: {
    fontScale: 1.0,
    contraste: 'normal',
    nivelDetalleMedicamentos: 'completo',
    mostrarHistorialCompleto: true,
    navegacion: 'completa',
  },
  [ROLES.FAMILIA]: {
    fontScale: 0.9,
    contraste: 'normal',
    nivelDetalleMedicamentos: 'completo',
    mostrarHistorialCompleto: true,
    navegacion: 'completa',
  },
};