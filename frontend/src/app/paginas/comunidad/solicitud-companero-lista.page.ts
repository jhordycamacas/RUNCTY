import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/solicitudes-companero/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-solicitud-companero-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class SolicitudCompaneroListaPage {
  protected readonly entidad = ENTIDADES['solicitudes-companero'];
}
