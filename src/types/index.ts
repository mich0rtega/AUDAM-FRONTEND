// Auth
export interface User {
  id: string;
  email: string;
  nombre?: string;
  environments?: UserEnvironment[];
}

export interface UserEnvironment {
  environmentId: string;
  role: Role;
  environment?: { id: string; name: string };
}

export type Role = 'ADMIN' | 'ALMACEN' | 'AUTORIZADOR' | 'COMPRAS' | 'USUARIO';

export interface LoginRequest {
  email: string;
  password: string;
  environmentId?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  environments: UserEnvironment[];
}

// Products
export interface Product {
  id: string;
  environmentId: string;
  typeId: string;
  statusId: string;
  proveedorId?: string;
  marca: string;
  modelo?: string;
  especificacion?: string;
  imagenUrl?: string;
  sku?: string;
  unit?: string;
  precioUnitario: number;
  stockActual: number;
  isActive: boolean;
  fechaUltimaCompra?: string;
  createdAt: string;
  type?: { id: string; name: string };
  status?: { id: string; name: string };
  proveedor?: { id: string; nombre: string };
}

export interface ProductType {
  id: string;
  name: string;
  description?: string;
  environmentId: string;
  isActive: boolean;
}

export interface ProductStatus {
  id: string;
  name: string;
  environmentId: string;
  isActive: boolean;
}

export interface MovementType {
  id: string;
  name: string;
  direction: 'IN' | 'OUT';
  environmentId: string;
  isActive: boolean;
}

export interface Movement {
  id: string;
  environmentId: string;
  typeId: string;
  responsibleId: string;
  costCenterId?: string;
  observations?: string;
  createdAt: string;
  type?: MovementType;
  details?: MovementDetail[];
}

export interface MovementDetail {
  id: string;
  movementId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  observations?: string;
  product?: Product;
}

export interface Asset {
  id: string;
  environmentId: string;
  categoryId: string;
  statusId: string;
  responsableId: string;
  marca: string;
  modelo?: string;
  numeroSerie?: string;
  ubicacion?: string;
  imagenUrl?: string;
  stockActual?: number;
  createdAt: string;
  category?: { id: string; name: string };
  status?: { id: string; name: string };
  responsable?: User;
}

export interface AssetCategory {
  id: string;
  name: string;
  environmentId: string;
  isActive: boolean;
}

export interface Provider {
  id: string;
  environmentId: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  environmentId: string;
  isActive: boolean;
}

export interface Requisition {
  id: string;
  environmentId: string;
  folio: string;
  solicitorId: string;
  solicitorName: string;
  destinationId: string;
  authorizerId?: string;
  requesterId: string;
  statusId: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  status?: { id: string; name: string };
  destination?: CostCenter;
  details?: RequisitionDetail[];
}

export interface RequisitionStatus {
  id: string;
  name: string;
  environmentId: string;
  isActive: boolean;
}

export interface RequisitionDetail {
  id: string;
  requisitionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  product?: Product;
}

export interface AuditLog {
  id: string;
  actorId: string;
  targetType: string;
  targetId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
  actor?: User;
}

export interface MovementSummary {
  entradas: number;
  salidas: number;
  stockCritico: number;
}

// Forgot password
export interface ForgotPasswordRequest {
  email: string;
}
export interface ForgotPasswordResponse {
  message: string;
}
