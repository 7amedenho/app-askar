# نظام إدارة التوريدات والمخزون

هذا الجزء من النظام مخصص لإدارة توريد المواد والمعدات للشركات الخارجية، ويشمل:

## الميزات الرئيسية

1. **إدارة الشركات العميلة**
   - إضافة شركات جديدة
   - تعديل بيانات الشركات
   - عرض فواتير كل شركة

2. **إدارة فواتير التوريد**
   - إنشاء فواتير جديدة
   - إضافة أصناف متعددة (معدات أو مستهلكات)
   - تغيير حالة الفواتير (معلقة، مكتملة، ملغاة)
   - طباعة الفواتير

3. **نظام التنبيهات**
   - تنبيهات المخزون المنخفض
   - إشعارات العمليات (نجاح، خطأ، تحذير)

## التثبيت والإعداد

1. تأكد من تشغيل الـ Prisma migrations لإضافة الجداول الجديدة:
   ```
   npx prisma migrate dev --name add_material_supply_models
   ```

2. في حالة وجود مشاكل في الـ migrations، يمكن تنفيذ ملف الـ SQL المتوفر في:
   ```
   prisma/migrations/add_material_supply_models.sql
   ```

## هيكل المشروع

- `page.tsx` - الصفحة الرئيسية للوحدة
- `layout.tsx` - إعداد التخطيط ونظام الإشعارات
- `NewClientCompany.tsx` - نموذج إضافة شركة جديدة
- `EditClientCompany.tsx` - نموذج تعديل بيانات شركة
- `NewMaterialInvoice.tsx` - نموذج إنشاء فاتورة جديدة
- `InvoiceDetails.tsx` - عرض تفاصيل الفاتورة وطباعتها
- `NotificationSystem.tsx` - نظام الإشعارات والتنبيهات

## API Endpoints

### الشركات العميلة
- `GET /api/client-companies` - عرض جميع الشركات
- `POST /api/client-companies` - إضافة شركة جديدة
- `GET /api/client-companies/:id` - عرض بيانات شركة محددة
- `PUT /api/client-companies/:id` - تعديل بيانات شركة
- `DELETE /api/client-companies/:id` - حذف شركة

### فواتير التوريد
- `GET /api/material-invoices` - عرض جميع الفواتير
- `POST /api/material-invoices` - إنشاء فاتورة جديدة
- `GET /api/material-invoices/:id` - عرض بيانات فاتورة محددة
- `PATCH /api/material-invoices/:id` - تحديث حالة فاتورة
- `DELETE /api/material-invoices/:id` - حذف فاتورة

## التحديثات المستقبلية

- تقارير المبيعات والتوريدات
- نظام تتبع المدفوعات
- ربط نظام التوريد بنظام المخزون
- إضافة قسم معاينة للفواتير قبل الإصدار 