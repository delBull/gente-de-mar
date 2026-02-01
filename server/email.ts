import { Resend } from "resend";
import { type Booking, type Tour } from "@shared/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmationEmail(booking: Booking, tour: Tour) {
    if (!booking.customerEmail) return { success: false, error: "No customer email" };

    try {
        const { data, error } = await resend.emails.send({
            from: "gente-de-mar@resend.dev", // Needs domain verification for custom
            to: booking.customerEmail,
            subject: `Reserva confirmada: ${tour.name}`,
            html: `
        <h1>¡Gracias por tu reserva, ${booking.customerName}!</h1>
        <p>Tu aventura en <strong>${tour.name}</strong> está confirmada.</p>
        <ul>
          <li><strong>Fecha:</strong> ${booking.bookingDate.toLocaleDateString()}</li>
          <li><strong>Adultos:</strong> ${booking.adults}</li>
          <li><strong>Niños:</strong> ${booking.children}</li>
          <li><strong>Código de reserva:</strong> ${booking.alphanumericCode}</li>
        </ul>
        <p>Por favor presenta tu código QR al llegar.</p>
      `,
        });

        if (error) return { success: false, error };
        return { success: true, data };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}

export async function sendPaymentFailedEmail(booking: Booking, tour: Tour) {
    if (!booking.customerEmail) return { success: false, error: "No customer email" };

    try {
        await resend.emails.send({
            from: "gente-de-mar@resend.dev",
            to: booking.customerEmail,
            subject: `Error en el pago: ${tour.name}`,
            html: `
        <h1>Hubo un problema con tu pago</h1>
        <p>No pudimos procesar el pago para tu reserva en <strong>${tour.name}</strong>.</p>
        <p>Por favor intenta de nuevo o contacta a soporte.</p>
      `,
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}
