export type Categoria = 'ropa' | 'productos' | 'promociones';

export interface Producto {
  id: string;
  barcode: string;
  caseBarcode?: string;
  unitsPerCase: number;
  name: string;
  category: Categoria;
  variant?: string;
  stock: number;
  minStock: number;
  updatedAt: string;
}

export type Rol = 'trabajador' | 'administrador';

export interface Usuario {
  id: string;
  username: string;
  displayName: string;
}

export interface Negocio {
  id: string;
  name: string;
  role: Rol;
}

export interface FileEstacion {
  id: string;
  code: string;
  name: string;
}
