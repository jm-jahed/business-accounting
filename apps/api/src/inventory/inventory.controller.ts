import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { InventoryService } from './inventory.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator.js';
import { JwtUserPayload } from '../auth/jwt.service.js';
import { TenantContext } from '@accounting/database';

@Controller('companies/:companyId/inventory')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.getOverviewStats(tenant);
  }

  @Post('init-standard')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.OK)
  async initStandard(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.initializeStandardMaster(tenant, user, meta);
  }

  // ==========================================
  // UNITS OF MEASURE
  // ==========================================

  @Get('uoms')
  @HttpCode(HttpStatus.OK)
  async listUoms(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.listUoms(tenant);
  }

  @Post('uoms')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createUom(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.createUom(tenant, user, body, meta);
  }

  // ==========================================
  // CATEGORIES & BRANDS
  // ==========================================

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async listCategories(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.listCategories(tenant);
  }

  @Post('categories')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.createCategory(tenant, user, body, meta);
  }

  @Get('brands')
  @HttpCode(HttpStatus.OK)
  async listBrands(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.listBrands(tenant);
  }

  @Post('brands')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createBrand(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any
  ) {
    return this.inventoryService.createBrand(tenant, user, body);
  }

  // ==========================================
  // WAREHOUSES & BINS
  // ==========================================

  @Get('warehouses')
  @HttpCode(HttpStatus.OK)
  async listWarehouses(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.listWarehouses(tenant);
  }

  @Post('warehouses')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async createWarehouse(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.createWarehouse(tenant, user, body, meta);
  }

  @Get('warehouses/:warehouseId/bins')
  @HttpCode(HttpStatus.OK)
  async listBins(
    @CurrentTenant() tenant: TenantContext,
    @Param('warehouseId') warehouseId: string
  ) {
    return this.inventoryService.listBins(tenant, warehouseId);
  }

  @Post('bins')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.CREATED)
  async createBin(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any
  ) {
    return this.inventoryService.createBin(tenant, user, body);
  }

  // ==========================================
  // ITEM MASTER
  // ==========================================

  @Get('items')
  @HttpCode(HttpStatus.OK)
  async listItems(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.inventoryService.listItems(tenant, {
      search,
      categoryId,
      type,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('items/:id')
  @HttpCode(HttpStatus.OK)
  async getItem(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.inventoryService.getItemById(tenant, id);
  }

  @Post('items')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.createItem(tenant, user, body, meta);
  }

  // ==========================================
  // STOCK ON HAND
  // ==========================================

  @Get('stock-balances')
  @HttpCode(HttpStatus.OK)
  async getStockBalances(
    @CurrentTenant() tenant: TenantContext,
    @Query('warehouseId') warehouseId?: string,
    @Query('itemId') itemId?: string
  ) {
    return this.inventoryService.getStockBalances(tenant, { warehouseId, itemId });
  }

  // ==========================================
  // STOCK TRANSFERS
  // ==========================================

  @Get('transfers')
  @HttpCode(HttpStatus.OK)
  async listTransfers(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.listTransfers(tenant);
  }

  @Post('transfers')
  @Roles('owner', 'admin', 'accountant')
  @HttpCode(HttpStatus.CREATED)
  async createTransfer(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtUserPayload,
    @Body() body: any,
    @Req() req: Request
  ) {
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return this.inventoryService.createTransfer(tenant, user, body, meta);
  }
}
