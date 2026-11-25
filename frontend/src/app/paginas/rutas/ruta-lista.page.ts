import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/rutas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-ruta-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class RutaListaPage {
  protected readonly entidad = ENTIDADES.rutas;
}
