interface EmailService {
    sendBookingConfirmation(to: string, bookingId: number, details: any): Promise<boolean>;
    sendReminder(to: string, bookingId: number, details: any): Promise<boolean>;
    sendReviewRequest(to: string, bookingId: number, details: any): Promise<boolean>;
    sendCartRecovery(to: string, bookingId: number, details: any): Promise<boolean>;
}

class MockEmailService implements EmailService {
    async sendBookingConfirmation(to: string, bookingId: number, details: any): Promise<boolean> {
        console.log(`[EMAIL MOCK] Sending Confirmation to ${to} for Booking #${bookingId}`);
        console.log(`[EMAIL BODY] Hola ${details.customerName}, tu tour a ${details.tourName} está confirmado.`);
        return true;
    }

    async sendReminder(to: string, bookingId: number, details: any): Promise<boolean> {
        console.log(`[EMAIL MOCK] Sending 24h Reminder to ${to} for Booking #${bookingId}`);
        console.log(`[EMAIL BODY] Hola ${details.customerName}, recuerda que mañana es tu tour a ${details.tourName}.`);
        console.log(`[EMAIL BODY] Ubicación: ${details.location}`);
        console.log(`[EMAIL BODY] Recomendaciones: ${details.requirements || "Llevar protector solar"}`);
        return true;
    }

    async sendReviewRequest(to: string, bookingId: number, details: any): Promise<boolean> {
        console.log(`[EMAIL MOCK] Sending Review Request to ${to} for Booking #${bookingId}`);
        console.log(`[EMAIL BODY] Hola ${details.customerName}, ¿cómo estuvo tu experiencia en ${details.tourName}?`);
        console.log(`[EMAIL BODY] Déjanos una reseña aquí: ${details.reviewUrl}`);
        return true;
    }

    async sendCartRecovery(to: string, bookingId: number, details: any): Promise<boolean> {
        console.log(`[EMAIL MOCK] Sending Cart Recovery to ${to} for Booking #${bookingId}`);
        console.log(`[EMAIL BODY] Hola ${details.customerName}, notamos que no completaste tu reserva para ${details.tourName}.`);
        console.log(`[EMAIL BODY] Retoma tu reserva aquí: ${details.recoveryUrl}`);
        return true;
    }
}

export const emailService = new MockEmailService();
