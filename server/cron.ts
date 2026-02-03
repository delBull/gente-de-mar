
import { storage } from "./storage";
import { emailService } from "./services/email";

export function startCronJobs() {
    console.log("[CRON] Starting background jobs...");

    // Run immediately on startup for testing (in prod, wait for interval)
    checkUpcomingBookings();
    checkPastBookings();
    checkAbandonedCarts();

    // Check every hour
    setInterval(() => {
        checkUpcomingBookings();
        checkPastBookings();
        checkAbandonedCarts();
    }, 60 * 60 * 1000);
}

async function checkUpcomingBookings() {
    try {
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        console.log(`[CRON] Checking bookings between ${tomorrowStart.toISOString()} and ${tomorrowEnd.toISOString()}`);

        const upcomingBookings = await storage.getBookingsByDateRange(tomorrowStart, tomorrowEnd);
        console.log(`[CRON] Found ${upcomingBookings.length} bookings for reminder.`);

        for (const booking of upcomingBookings) {
            // In a real DB, we would check if reminder was already sent (flag in DB)
            // For now, we trust the date range check creates "buckets" effectively, 
            // though running every hour overlaps. Ideally we store 'reminderSent' boolean.
            // Since schema doesn't have it yet, we just log.

            const tour = await storage.getTour(booking.tourId);

            if (booking.customerEmail) {
                await emailService.sendReminder(booking.customerEmail, booking.id, {
                    customerName: booking.customerName,
                    tourName: tour?.name || "Tour",
                    location: tour?.location || "Puerto Vallarta",
                    requirements: tour?.requirements
                });
            }
        }

    } catch (error) {
        console.error("[CRON] Error checking bookings:", error);
    }
}

async function checkPastBookings() {
    try {
        // Check for bookings that ended yesterday (simple logic: bookingDate was yesterday)
        const now = new Date();
        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setHours(23, 59, 59, 999);

        // We reuse getBookingsByDateRange since it filters by confirmed status too
        const pastBookings = await storage.getBookingsByDateRange(yesterdayStart, yesterdayEnd);
        console.log(`[CRON] Found ${pastBookings.length} past bookings for review.`);

        for (const booking of pastBookings) {
            if (booking.customerEmail) {
                const tour = await storage.getTour(booking.tourId);
                await emailService.sendReviewRequest(booking.customerEmail, booking.id, {
                    customerName: booking.customerName,
                    tourName: tour?.name || "Tour",
                    reviewUrl: `https://bookeros.com/review/${booking.id}`
                });
            }
        }
    } catch (error) {
        console.error("[CRON] Error checking past bookings:", error);
    }
}

async function checkAbandonedCarts() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now);
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // Using the new storage method
        const abandonedBookings = await storage.getPendingBookingsOlderThan(oneHourAgo);
        console.log(`[CRON] Found ${abandonedBookings.length} abandoned bookings.`);

        for (const booking of abandonedBookings) {
            if (booking.customerEmail) {
                const tour = await storage.getTour(booking.tourId);
                await emailService.sendCartRecovery(booking.customerEmail, booking.id, {
                    customerName: booking.customerName,
                    tourName: tour?.name || "Tour",
                    recoveryUrl: `https://bookeros.com/checkout/${booking.id}`
                });
            }
        }
    } catch (error) {
        console.error("[CRON] Error checking abandoned carts:", error);
    }
}
