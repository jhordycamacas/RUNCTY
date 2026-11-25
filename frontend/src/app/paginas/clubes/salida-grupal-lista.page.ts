import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/salidas-grupales/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-salida-grupal-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class SalidaGrupalListaPage {
  protected readonly entidad = ENTIDADES['salidas-grupales'];
}
