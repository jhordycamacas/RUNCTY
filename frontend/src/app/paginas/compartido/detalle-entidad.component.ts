import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonListHeader, IonNote, IonSpinner, IonTitle, IonToolbar, NavController,
  ToastController,
} from '@ionic/angular';
import { catchError, forkJoin, map, of } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Campo, Entidad, entidadDe, etiquetaDe } from '../../core/entidades';
import { interpretarError } from '../../core/errores';
import { DatosService } from './datos.service';
import { textoCampo } from './formato';
import { NivelBadgeComponent } from './nivel-badge.component';

type Registro = Record<string, unknown> & { id: number };

/**
 * Detalle genérico: todos los campos (FK por nombre y con enlace), enlaces a las listas hijas,
 * editar y eliminar con confirmación (204 correcto, 409 si hay registros que dependen de él).
 */
@Component({
  selector: 'app-detalle-entidad',
  host: { style: 'display: contents' },
  imports: [
    RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel,
    IonList, IonListHeader, IonNote, IonSpinner, IonTitle, IonToolbar, NivelBadgeComponent,
  ],
  styles: `
    pre { white-space: pre-wrap; word-break: break-word; font-size: 0.8rem; margin: 4px 0 0; }
    .acciones { display: flex; gap: 8px; flex-wrap: wrap; padding: 16px 0; }
  `,
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/' + entidad().endpoint"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ registro() ? titulo() : entidad().titulo }}</ion-title>
        @if (registro()) {
          <ion-buttons slot="end">
            <ion-button [routerLink]="['/', entidad().endpoint, id(), 'editar']" aria-label="Editar">
              <ion-icon slot="icon-only" name="create"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="contenedor">
        @if (error()) {
          <div class="aviso-error" role="alert">{{ error() }}</div>
        }
        @if (cargando()) {
          <div class="ion-text-center ion-padding"><ion-spinner name="crescent"></ion-spinner></div>
        }

        @if (registro(); as r) {
          <ion-list>
            <ion-list-header><ion-label>{{ entidad().titulo }} #{{ r.id }}</ion-label></ion-list-header>
            @for (campo of entidad().campos; track campo.nombre) {
              @if (campo.tipo === 'fk' && r[campo.nombre]) {
                <ion-item [routerLink]="['/', campo.endpoint, r[campo.nombre]]" detail>
                  <ion-label>
                    <p>{{ campo.etiqueta }}</p>
                    <h3>{{ texto(campo, r) }}</h3>
                  </ion-label>
                </ion-item>
              } @else if (!(campo.soloCrear && r[campo.nombre] === undefined)) {
                <ion-item>
                  <ion-label>
                    <p>{{ campo.etiqueta }}</p>
                    @if (campo.tipo === 'nivel') {
                      <app-nivel-badge [nivel]="$any(r[campo.nombre])" />
                    } @else if (campo.tipo === 'json') {
                      <pre>{{ texto(campo, r) }}</pre>
                    } @else {
                      <h3>{{ texto(campo, r) }}</h3>
                    }
                  </ion-label>
                </ion-item>
              }
            }
          </ion-list>

          <ng-content />

          @if (hijos().length) {
            <ion-list>
              <ion-list-header><ion-label>Registros relacionados</ion-label></ion-list-header>
              @for (hijo of hijos(); track hijo.endpoint + hijo.filtro) {
                <ion-item [routerLink]="['/', hijo.endpoint]" [queryParams]="hijo.queryParams" detail>
                  <ion-icon slot="start" [name]="hijo.icono" color="primary"></ion-icon>
                  <ion-label>{{ hijo.plural }}</ion-label>
                </ion-item>
              }
            </ion-list>
          }

          <div class="acciones">
            <ion-button [routerLink]="['/', entidad().endpoint, id(), 'editar']">
              <ion-icon slot="start" name="create"></ion-icon> Editar
            </ion-button>
            <ion-button color="danger" fill="outline" (click)="confirmarEliminar()" [disabled]="eliminando()">
              <ion-icon slot="start" name="trash"></ion-icon> Eliminar
            </ion-button>
          </div>
          <ion-note>Al eliminar, el backend responde 409 si otros registros dependen de este.</ion-note>
        }
      </div>
    </ion-content>
  `,
})
export class DetalleEntidadComponent {
  readonly entidad = input.required<Entidad>();
  readonly id = input.required<string>();
  /** Emite el registro cargado, para que la página muestre información extra. */
  readonly cargado = output<Registro>();

  private readonly api = inject(ApiService);
  private readonly datos = inject(DatosService);
  private readonly alerta = inject(AlertController);
  private readonly toast = inject(ToastController);
  private readonly nav = inject(NavController);

  protected readonly registro = signal<Registro | null>(null);
  /** Nombres de las FK que el backend no devuelve como `<campo>_nombre`. */
  protected readonly nombresFk = signal<Record<string, string>>({});
  protected readonly cargando = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly error = signal('');

  protected readonly titulo = computed(() => etiquetaDe(this.entidad(), this.registro() ?? {}));

  protected readonly hijos = computed(() =>
    (this.entidad().hijos ?? []).map((hijo) => {
      const meta = entidadDe(hijo.endpoint);
      return {
        ...hijo,
        plural: meta?.plural ?? hijo.endpoint,
        icono: meta?.icono ?? 'list',
        queryParams: { [hijo.filtro]: this.id() },
      };
    }),
  );

  constructor() {
    effect(() => {
      const id = this.id();
      this.entidad();
      this.datos.version();
      untracked(() => this.cargar(id));
    });
  }

  protected texto(campo: Campo, registro: Registro): string {
    return textoCampo(campo, registro, this.nombresFk()[campo.nombre]);
  }

  protected async confirmarEliminar(): Promise<void> {
    const confirmacion = await this.alerta.create({
      header: `Eliminar ${this.entidad().titulo.toLowerCase()}`,
      message: `¿Seguro que quieres eliminar "${this.titulo()}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminar() },
      ],
    });
    await confirmacion.present();
  }

  private eliminar(): void {
    const entidad = this.entidad();
    this.eliminando.set(true);
    this.error.set('');
    this.api.recurso(entidad.endpoint).eliminar(this.id()).subscribe({
      next: () => {
        // 204 No Content.
        this.eliminando.set(false);
        void this.avisar(`Registro eliminado: ${entidad.titulo}.`, 'success');
        void this.nav.navigateBack(['/', entidad.endpoint]).then(() => this.datos.notificarCambio(entidad.endpoint));
      },
      error: (e) => {
        this.eliminando.set(false);
        const mensaje = interpretarError(e).general;
        this.error.set(mensaje);
        void this.avisar(mensaje, 'danger');
      },
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.recurso<Registro>(this.entidad().endpoint).obtener(id).subscribe({
      next: (registro) => {
        this.registro.set(registro);
        this.cargando.set(false);
        this.cargado.emit(registro);
        this.resolverNombresFk(registro);
      },
      error: (e) => {
        this.registro.set(null);
        this.cargando.set(false);
        this.error.set(interpretarError(e).general);
      },
    });
  }

  /** Busca el nombre de las FK sin `<campo>_nombre` (ej.: Favorita.usuario, Evento.ruta). */
  private resolverNombresFk(registro: Registro): void {
    const pendientes = this.entidad().campos.filter(
      (c) => c.tipo === 'fk' && c.endpoint && registro[c.nombre] && registro[`${c.nombre}_nombre`] === undefined,
    );
    if (!pendientes.length) {
      return;
    }
    forkJoin(
      Object.fromEntries(
        pendientes.map((campo) => [
          campo.nombre,
          this.api.recurso(campo.endpoint!).obtener(String(registro[campo.nombre])).pipe(
            map((fk) => etiquetaDe(entidadDe(campo.endpoint!), fk as unknown as Record<string, unknown>)),
            catchError(() => of(`#${registro[campo.nombre]}`)),
          ),
        ]),
      ),
    ).subscribe((nombres) => this.nombresFk.set(nombres));
  }

  private async avisar(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const aviso = await this.toast.create({ message: mensaje, color, duration: 3500, position: 'top' });
    await aviso.present();
  }
}
