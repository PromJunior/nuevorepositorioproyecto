import { z } from 'zod';

export const companySettingsSchema = z.object({
    legal_name: z.string().min(1),
    trade_name: z.string().optional().nullable(),
    ruc: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    website: z.string().optional().nullable(),
    logo_url: z.string().optional().nullable(),
    primary_currency: z.string().min(1),
    secondary_currency: z.string().optional().nullable(),
});

export const paymentMethodSettingsSchema = z.object({
    name_payment_method: z.string().min(1),
    is_active: z.boolean(),
    display_order: z.number().min(0),
});

export const webhookSettingsSchema = z.object({
    webhook_enabled: z.boolean(),
    webhook_url: z.string().url().optional().or(z.literal('')).nullable(),
    webhook_secret: z.string().optional().or(z.literal('')).nullable(),
});
