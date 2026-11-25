import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/factores-riesgo/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-factor-riesgo-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class FactorRiesgoListaPage {
  protected readonly entidad = ENTIDADES['factores-riesgo'];
}
