import { storage } from '../server/storage';

async function main() {
    try {
        console.log('Seeding coupon...');
        const coupon = await storage.createCoupon({
            code: 'WELCOME2025',
            discountType: 'percent',
            discountValue: 20,
            expirationDate: new Date('2025-12-31'),
            usageLimit: 100,
            businessId: null
        });
        console.log('Coupon created:', coupon);
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            console.log('Coupon WELCOME2025 already exists');
        } else {
            console.error('Error seeding coupon:', err);
        }
    }
    process.exit(0);
}

main();
