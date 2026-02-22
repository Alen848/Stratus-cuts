import { Cliente } from './cliente';
import { Empleado } from './empleado';

export interface TurnoServicio {
  id: number;
  turno_id: number;
  servicio_id: number;
  cantidad: number;
  precio_unitario: number;
  servicio: {
    id: number;
    nombre: string;
    precio: number;
  };
}

export interface Turno {
  id: number;
  fecha_hora: string;
  estado: string;
  observaciones: string | null;
  cliente_id: number;
  empleado_id: number;
  cliente: Cliente;
  empleado: Empleado;
  servicios: TurnoServicio[];
}
