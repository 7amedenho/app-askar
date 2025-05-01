-- CreateTable
CREATE TABLE `ClientCompany` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NULL,
  `address` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `contactName` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `ClientCompany_code_key`(`code`),
  INDEX `ClientCompany_name_code_idx`(`name`, `code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialInvoice` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `clientCompanyId` INTEGER NOT NULL,
  `invoiceNumber` VARCHAR(191) NOT NULL,
  `invoiceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `dueDate` DATETIME(3) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `MaterialInvoice_clientCompanyId_invoiceNumber_key`(`clientCompanyId`, `invoiceNumber`),
  INDEX `MaterialInvoice_invoiceDate_status_idx`(`invoiceDate`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialInvoiceItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `invoiceId` INTEGER NOT NULL,
  `itemType` VARCHAR(191) NOT NULL,
  `itemId` INTEGER NOT NULL,
  `itemName` VARCHAR(191) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `totalPrice` DECIMAL(10, 2) NOT NULL,
  `notes` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `MaterialInvoiceItem_invoiceId_itemType_idx`(`invoiceId`, `itemType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MaterialInvoice` ADD CONSTRAINT `MaterialInvoice_clientCompanyId_fkey` FOREIGN KEY (`clientCompanyId`) REFERENCES `ClientCompany`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialInvoiceItem` ADD CONSTRAINT `MaterialInvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `MaterialInvoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; 