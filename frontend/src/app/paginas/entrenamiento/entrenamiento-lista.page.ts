import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/entrenamientos/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-entrenamiento-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class EntrenamientoListaPage {
  protected readonly entidad = ENTIDADES.entrenamientos;
}
