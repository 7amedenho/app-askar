/*
  Warnings:

  - You are about to drop the `InventoryItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `MaterialInvoiceItem` ADD COLUMN `inventoryConsumableId` INTEGER NULL,
    ADD COLUMN `inventoryEquipmentId` INTEGER NULL;

-- DropTable
DROP TABLE `InventoryItem`;

-- CreateTable
CREATE TABLE `InventoryConsumable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `baseQuantity` INTEGER NOT NULL DEFAULT 0,
    `supplierId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InventoryConsumable_code_key`(`code`),
    INDEX `InventoryConsumable_name_code_idx`(`name`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryEquipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `notes` VARCHAR(191) NULL,
    `supplierId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InventoryEquipment_code_key`(`code`),
    INDEX `InventoryEquipment_name_code_idx`(`name`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MaterialInvoiceItem` ADD CONSTRAINT `MaterialInvoiceItem_inventoryConsumableId_fkey` FOREIGN KEY (`inventoryConsumableId`) REFERENCES `InventoryConsumable`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialInvoiceItem` ADD CONSTRAINT `MaterialInvoiceItem_inventoryEquipmentId_fkey` FOREIGN KEY (`inventoryEquipmentId`) REFERENCES `InventoryEquipment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryConsumable` ADD CONSTRAINT `InventoryConsumable_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryEquipment` ADD CONSTRAINT `InventoryEquipment_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
