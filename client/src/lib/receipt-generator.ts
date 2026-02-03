
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Define generic interfaces due to shared definitions not being readily available in frontend sometimes,
// or import them if available. For now, using loose typing for flexibility.
interface BookingReceiptData {
    bookingId: number;
    customerName: string;
    customerEmail: string;
    tourName: string;
    bookingDate: string | Date;
    amount: number | string;
    adults: number;
    children: number;
    currency?: string;
}

export const generateBookingReceipt = (data: BookingReceiptData, businessName: string = "Gente de Mar") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // -- Header --
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(businessName, 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Comprobante de Pago", 20, 28);

    // Right aligned info
    doc.setFontSize(10);
    doc.text(`Recibo #: ${data.bookingId}`, pageWidth - 20, 20, { align: "right" });
    doc.text(`Fecha: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth - 20, 25, { align: "right" });

    // -- Customer Info --
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, pageWidth - 20, 35);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Información del Cliente", 20, 45);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Nombre: ${data.customerName}`, 20, 52);
    doc.text(`Email: ${data.customerEmail || "N/A"}`, 20, 57);

    // -- Tour Info --
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalles de la Reserva", 20, 70);

    const tourDate = new Date(data.bookingDate);
    const formattedDate = format(tourDate, "EEEE d 'de' MMMM, yyyy", { locale: es });

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Tour: ${data.tourName}`, 20, 77);
    doc.text(`Fecha del Tour: ${formattedDate}`, 20, 82);
    doc.text(`Pasajeros: ${data.adults} adultos, ${data.children} niños`, 20, 87);

    // -- Table --
    const currency = data.currency || "MXN";
    const amount = parseFloat(data.amount.toString());

    autoTable(doc, {
        startY: 100,
        head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']],
        body: [
            [data.tourName, '1', `$${amount.toFixed(2)} ${currency}`, `$${amount.toFixed(2)} ${currency}`],
        ],
        foot: [
            ['', '', 'Total', `$${amount.toFixed(2)} ${currency}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // -- Footer --
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Gracias por su preferencia.", pageWidth / 2, finalY, { align: "center" });
    doc.text("Este comprobante es válido para fines informativos.", pageWidth / 2, finalY + 5, { align: "center" });

    // Save
    doc.save(`recibo_reserva_${data.bookingId}.pdf`);
};
