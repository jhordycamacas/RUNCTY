import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/solicitudes-ruta-segura/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-solicitud-ruta-segura-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class SolicitudRutaSeguraListaPage {
  protected readonly entidad = ENTIDADES['solicitudes-ruta-segura'];
}
