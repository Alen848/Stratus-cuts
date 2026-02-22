interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_registro: string;
}

type ClienteCreate = Omit<Cliente, 'id' | 'fecha_registro'>;
type ClienteUpdate = Partial<ClienteCreate>;

export type { Cliente, ClienteCreate, ClienteUpdate };
