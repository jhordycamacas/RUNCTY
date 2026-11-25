import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/notificaciones/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-notificacion-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class NotificacionListaPage {
  protected readonly entidad = ENTIDADES.notificaciones;
}
