// Utilidades compartidas entre cliente y servidor

/**
 * Genera un código alfanumérico único para tickets
 * Formato: XXXX-XXXX-XXXX-XXXX (16 caracteres + 3 guiones)
 * Usa caracteres que evitan confusión: sin 0, O, I, 1, L
 */
export function generateAlphanumericCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const segments = [];
  
  // Generar 4 segmentos de 4 caracteres cada uno
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * Valida el formato de un código alfanumérico
 */
export function isValidAlphanumericCode(code: string): boolean {
  const pattern = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;
  return pattern.test(code);
}

/**
 * Verifica si un usuario puede redimir tickets
 */
export function canRedeemTickets(userRole: string): boolean {
  return userRole === 'business' || userRole === 'manager';
}

/**
 * Verifica si un usuario puede crear tours
 */
export function canCreateTours(userRole: string): boolean {
  return userRole === 'business';
}