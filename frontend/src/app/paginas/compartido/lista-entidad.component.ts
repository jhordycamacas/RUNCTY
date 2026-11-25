import { Component, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonHeader, IonIcon,
  IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonSearchbar, IonSelect, IonSelectOption,
  IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { forkJoin, map, of } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Filtros } from '../../core/crud.service';
import { Campo, Entidad, Opcion, etiquetaDe } from '../../core/entidades';
import { mensajeError } from '../../core/errores';
import { DatosService } from './datos.service';
import { textoCampo } from './formato';
import { NivelBadgeComponent } from './nivel-badge.component';

type Registro = Record<string, unknown> & { id: number };

const OPCIONES_SI_NO: Opcion[] = [
  { valor: 'true', etiqueta: 'Sí' },
  { valor: 'false', etiqueta: 'No' },
];

/**
 * Listado genérico paginado de una entidad: búsqueda, filtros (en la URL, así los enlaces
 * desde un registro padre llegan ya filtrados), "cargar más", estados vacío y de error.
 */
@Component({
  selector: 'app-lista-entidad',
  host: { style: 'display: contents' },
  imports: [
    RouterLink, IonBadge, IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonHeader,
    IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonSearchbar, IonSelect,
    IonSelectOption, IonSpinner, IonTitle, IonToolbar, NivelBadgeComponent,
  ],
  styles: `
    .filtros { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px 8px; }
    .filtros ion-select { min-width: 150px; max-width: 220px; }
    .pie { display: flex; justify-content: center; padding: 16px 0 88px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ entidad().plural }}</ion-title>
        <ion-buttons slot="end">
          <ion-badge color="light">{{ total() }}</ion-badge>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar placeholder="Buscar" [debounce]="400" [value]="busqueda()"
          (ionInput)="busqueda.set($any($event).detail.value ?? '')"></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="contenedor">
        @if (camposFiltro().length || filtrosExternos().length) {
          <div class="filtros">
            @for (campo of camposFiltro(); track campo.nombre) {
              <ion-select [label]="campo.etiqueta" labelPlacement="stacked" interface="popover"
                fill="outline" [value]="filtros()[campo.nombre] ?? ''"
                (ionChange)="filtrar(campo.nombre, $any($event).detail.value)">
                <ion-select-option value="">Todos</ion-select-option>
                @for (opcion of opcionesFiltro()[campo.nombre] ?? []; track opcion.valor) {
                  <ion-select-option [value]="opcion.valor">{{ opcion.etiqueta }}</ion-select-option>
                }
              </ion-select>
            }
            @for (clave of filtrosExternos(); track clave) {
              <ion-chip (click)="filtrar(clave, '')">
                <ion-label>Filtrado por {{ clave.replace('__', ' de ') }} #{{ filtros()[clave] }}</ion-label>
                <ion-icon name="close-circle"></ion-icon>
              </ion-chip>
            }
          </div>
        }

        @if (error()) {
          <div class="aviso-error ion-margin">
            {{ error() }}
            <ion-button fill="clear" size="small" (click)="cargar(1)">Reintentar</ion-button>
          </div>
        }

        <ion-list>
          @for (registro of registros(); track registro.id) {
            <ion-item [routerLink]="['/', entidad().endpoint, registro.id]" detail>
              <ion-icon slot="start" [name]="entidad().icono" color="primary"></ion-icon>
              <ion-label>
                <h2>{{ etiqueta(registro) }}</h2>
                <p>{{ resumen(registro) }}</p>
              </ion-label>
              @if (campoNivel(); as campo) {
                <app-nivel-badge slot="end" [nivel]="$any(registro[campo.nombre])" />
              }
            </ion-item>
          }
        </ion-list>

        @if (cargando()) {
          <div class="pie"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (!error() && registros().length === 0) {
          <p class="estado-vacio">No hay {{ entidad().plural.toLowerCase() }} registrados. Pulsa + para crear uno.</p>
        } @else if (hayMas()) {
          <div class="pie">
            <ion-button fill="outline" (click)="cargar(pagina() + 1)">
              Cargar más ({{ registros().length }} de {{ total() }})
            </ion-button>
          </div>
        } @else {
          <div class="pie"><ion-note>{{ registros().length }} de {{ total() }}</ion-note></div>
        }
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button [routerLink]="['/', entidad().endpoint, 'nuevo']" [queryParams]="filtros()"
          [attr.aria-label]="'Nuevo ' + entidad().titulo.toLowerCase()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
})
export class ListaEntidadComponent implements OnInit {
  readonly entidad = input.required<Entidad>();

  private readonly api = inject(ApiService);
  private readonly datos = inject(DatosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly registros = signal<Registro[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(1);
  protected readonly hayMas = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly busqueda = signal('');
  protected readonly opcionesFiltro = signal<Record<string, Opcion[]>>({});

  /** Filtros tomados de la URL (?ciudad=1&activa=true). */
  protected readonly filtros = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => Object.fromEntries(params.keys.map((k) => [k, params.get(k) ?? ''])) as Record<string, string>),
    ),
    { initialValue: {} as Record<string, string> },
  );

  protected readonly camposFiltro = computed(() =>
    this.entidad().filtros
      .map((nombre) => this.entidad().campos.find((c) => c.nombre === nombre))
      .filter((c): c is Campo => !!c),
  );

  /** Filtros de la URL que no tienen selector (ej.: tramo__ruta desde el detalle de una ruta). */
  protected readonly filtrosExternos = computed(() =>
    Object.keys(this.filtros()).filter((k) => !this.entidad().filtros.includes(k) && this.filtros()[k]),
  );

  protected readonly campoNivel = computed(() =>
    this.entidad().campos.find((c) => c.tipo === 'nivel' && this.entidad().columnas.includes(c.nombre)),
  );

  private readonly camposResumen = computed(() =>
    this.entidad().columnas
      .map((nombre) => this.entidad().campos.find((c) => c.nombre === nombre))
      .filter((c): c is Campo => !!c && c.tipo !== 'nivel'),
  );

  constructor() {
    // Recarga desde la página 1 cuando cambian filtros, búsqueda o datos (crear/editar/eliminar).
    effect(() => {
      this.filtros();
      this.busqueda();
      this.datos.version();
      untracked(() => this.cargar(1));
    });
  }

  ngOnInit(): void {
    this.cargarOpcionesFiltro();
  }

  protected etiqueta(registro: Registro): string {
    return etiquetaDe(this.entidad(), registro);
  }

  protected resumen(registro: Registro): string {
    return this.camposResumen()
      .map((campo) => `${campo.etiqueta}: ${textoCampo(campo, registro)}`)
      .join(' · ');
  }

  protected filtrar(clave: string, valor: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [clave]: valor || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected cargar(pagina: number): void {
    const filtros: Filtros = { ...this.filtros(), search: this.busqueda().trim() };
    this.cargando.set(true);
    this.error.set('');
    this.api
      .recurso<Registro>(this.entidad().endpoint)
      .listar(pagina, filtros)
      .subscribe({
        next: (respuesta) => {
          this.registros.update((previos) => (pagina === 1 ? respuesta.results : [...previos, ...respuesta.results]));
          this.total.set(respuesta.count);
          this.pagina.set(pagina);
          this.hayMas.set(!!respuesta.next);
          this.cargando.set(false);
        },
        error: (e) => {
          if (pagina === 1) {
            this.registros.set([]);
            this.total.set(0);
          }
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }

  private cargarOpcionesFiltro(): void {
    const pedidos = Object.fromEntries(
      this.camposFiltro().map((campo) => [
        campo.nombre,
        campo.tipo === 'fk' && campo.endpoint
          ? this.datos.opcionesDe(campo.endpoint)
          : of(campo.tipo === 'checkbox' ? OPCIONES_SI_NO : (campo.opciones ?? [])),
      ]),
    );
    if (!Object.keys(pedidos).length) {
      return;
    }
    forkJoin(pedidos).subscribe({
      next: (opciones) => this.opcionesFiltro.set(opciones),
      error: () => this.opcionesFiltro.set({}),
    });
  }
}
