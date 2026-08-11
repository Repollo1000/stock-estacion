export type Categoria = 'ropa' | 'productos' | 'promociones';

export interface Producto {
  id: string;
  barcode: string;
  name: string;
  category: Categoria;
  variant?: string;
  stock: number;
  minStock: number;
  updatedAt: string;
}

export interface Usuario {
  username: string;
  password: string;
  displayName: string;
}

export interface FileEstacion {
  code: string;
  name: string;
}