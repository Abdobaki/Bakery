import { z } from 'zod';

export const breadTypeSchema = z.object({
  name: z.string().min(1, 'اسم نوع الخبز مطلوب'),
  currentPrice: z.number().positive('السعر يجب أن يكون أكبر من 0'),
  isActive: z.boolean().default(true)
});

export const externalProductSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب'),
  purchasePrice: z.number().min(0, 'سعر الشراء لا يمكن أن يكون سالباً'),
  sellingPrice: z.number().positive('سعر البيع يجب أن يكون أكبر من 0'),
  isActive: z.boolean().default(true)
});

export const breadTrayItemInputSchema = z.object({
  breadTypeId: z.number().int().positive(),
  quantity: z.number().int().positive('الكمية يجب أن تكون 1 على الأقل')
});

export const addBreadTraySchema = z.object({
  shiftId: z.number().int().positive(),
  notes: z.string().optional(),
  items: z.array(breadTrayItemInputSchema).min(1, 'يجب إضافة نوع خبز واحد على الأقل')
});

export const inventoryMovementInputSchema = z.object({
  shiftId: z.number().int().positive(),
  productId: z.number().int().positive(),
  movementType: z.enum(['OPENING', 'RECEIVED', 'SOLD', 'ADJUSTMENT', 'CLOSING']),
  quantity: z.number().int().min(0, 'الكمية لا يمكن أن تكون سالبة'),
  notes: z.string().optional()
});

export const workerPaymentInputSchema = z.object({
  shiftId: z.number().int().positive(),
  workerId: z.number().int().positive(),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  paymentType: z.string().min(1),
  notes: z.string().optional()
});

export const expenseInputSchema = z.object({
  shiftId: z.number().int().positive(),
  title: z.string().min(1, 'عنوان المصروف مطلوب'),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  category: z.enum([
    'INGREDIENTS',
    'FLOUR',
    'YEAST',
    'OIL',
    'ELECTRICITY',
    'REPAIRS',
    'CLEANING',
    'MAINTENANCE',
    'TRANSPORTATION',
    'EQUIPMENT',
    'OTHER'
  ]),
  notes: z.string().optional(),
  receiptPhotoUri: z.string().optional()
});

export const closeShiftSchema = z.object({
  shiftId: z.number().int().positive(),
  actualCashHanded: z.number().min(0, 'المبلغ النقدي لا يمكن أن يكون سالباً'),
  notes: z.string().optional()
});
