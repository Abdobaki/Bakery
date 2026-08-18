import { ExpenseCategory, ShiftType, WorkerPaymentType } from '../types/index.js';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; labelAr: string; labelFr: string }[] = [
  { id: 'INGREDIENTS', labelAr: 'مكونات ومواد أولية', labelFr: 'Ingrédients' },
  { id: 'FLOUR', labelAr: 'فرينة (طحين)', labelFr: 'Farine' },
  { id: 'YEAST', labelAr: 'خميرة', labelFr: 'Levure' },
  { id: 'OIL', labelAr: 'زيت', labelFr: 'Huile' },
  { id: 'ELECTRICITY', labelAr: 'كهرباء وغاز', labelFr: 'Électricité & Gaz' },
  { id: 'REPAIRS', labelAr: 'تصليح وصيانة', labelFr: 'Réparations' },
  { id: 'CLEANING', labelAr: 'تنظيف ومواد نظافة', labelFr: 'Nettoyage' },
  { id: 'MAINTENANCE', labelAr: 'صيانة معدات', labelFr: 'Maintenance' },
  { id: 'TRANSPORTATION', labelAr: 'نقل وشحن', labelFr: 'Transport' },
  { id: 'EQUIPMENT', labelAr: 'شراء معدات', labelFr: 'Équipement' },
  { id: 'OTHER', labelAr: 'مصاريف أخرى', labelFr: 'Autres dépenses' }
];

export const WORKER_PAYMENT_TYPES: { id: WorkerPaymentType; labelAr: string; labelFr: string }[] = [
  { id: 'DAILY', labelAr: 'يومي', labelFr: 'Journalier' },
  { id: 'WEEKLY', labelAr: 'أسبوعي', labelFr: 'Hebdomadaire' },
  { id: 'MONTHLY', labelAr: 'شهري', labelFr: 'Mensuel' },
  { id: 'OTHER', labelAr: 'آخر', labelFr: 'Autre' }
];

export const SHIFT_TYPES: { id: ShiftType; labelAr: string; labelFr: string }[] = [
  { id: 'MORNING', labelAr: 'وردية صباحية', labelFr: 'Poste du matin' },
  { id: 'EVENING', labelAr: 'وردية مسائية', labelFr: 'Poste du soir' }
];

export const DEFAULT_APP_SETTINGS = {
  bakeryName: 'مخبزة الأصالة',
  address: 'الجزائر العاصمة، الجزائر',
  phone: '0550000000',
  currency: 'د.ج',
  currencyCode: 'DZD',
  morningShiftName: 'الوردية الصباحية',
  eveningShiftName: 'الوردية المسائية'
};

export const INITIAL_BREAD_TYPES = [
  { name: 'خبز عادي (Pain ordinaire)', price: 15, sortOrder: 1 },
  { name: 'خبز سيپار (Seppar)', price: 15, sortOrder: 2 },
  { name: 'خبز سميد (Pain de semoule)', price: 20, sortOrder: 3 },
  { name: 'خبز مدور (Bread round)', price: 25, sortOrder: 4 }
];

export const INITIAL_EXTERNAL_PRODUCTS = [
  { name: 'كسرة (Kesra)', purchasePrice: 35, sellingPrice: 50, sortOrder: 1 },
  { name: 'بيتزا كاري (Pizza carré)', purchasePrice: 40, sellingPrice: 60, sortOrder: 2 },
  { name: 'كرواسون (Croissant)', purchasePrice: 30, sellingPrice: 45, sortOrder: 3 }
];
