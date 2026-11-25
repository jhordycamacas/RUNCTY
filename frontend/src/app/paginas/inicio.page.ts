import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonGrid, IonHeader,
  IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonRow, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { catchError, forkJoin, of } from 'rxjs';

import { ApiService } from '../core/api.service';
import { Entidad, MODULOS, Modulo, entidadesDelModulo } from '../core/entidades';
import { mensajeError } from '../core/errores';
import { Ruta } from '../core/modelos';
import { DatosService } from './compartido/datos.service';
import { NivelBadgeComponent } from './compartido/nivel-badge.component';

interface ResumenModulo {
  modulo: Modulo;
  entidades: { entidad: Entidad; total: number | null }[];
}

/** Panel de inicio: registros por módulo y nivel de seguridad de las rutas. */
@Component({
  selector: 'app-inicio',
  imports: [
    RouterLink, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonContent, IonGrid,
    IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonRow, IonSpinner, IonTitle,
    IonToolbar, NivelBadgeComponent,
  ],
  styles: `
    .marca { display: flex; align-items: center; gap: 12px; padding: 8px 4px 16px; }
    .marca img { width: 56px; height: 56px; border-radius: 12px; }
    .marca h1 { margin: 0; font-weight: 800; color: var(--ion-color-primary); }
    ion-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; }
    ion-card { margin: 0 0 12px; }
  `,
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="contenedor">
        <div class="marca">
          <img src="logo.png" alt="Logo RUNCTY" />
          <div>
            <h1>RUNCTY</h1>
            <ion-note>Rutas seguras para correr en Loja</ion-note>
          </div>
        </div>

        @if (error()) {
          <div class="aviso-error" role="alert">{{ error() }}</div>
        }

        <ion-card>
          <ion-card-header>
            <ion-card-title><ion-icon name="shield-checkmark" color="primary"></ion-icon> Seguridad de las rutas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (rutas() === null) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-list lines="full">
                @for (ruta of rutas(); track ruta.id) {
                  <ion-item [routerLink]="['/rutas', ruta.id]" detail>
                    <ion-label>
                      <h3>{{ ruta.nombre }}</h3>
                      <p>{{ ruta.ciudad_nombre }} · {{ ruta.distancia_km }} km ·
                        @for (s of ruta.seguridad; track s.franja) {
                          {{ s.franja_nombre }} {{ s.puntaje }}{{ $last ? '' : ',' }}
                        }
                      </p>
                    </ion-label>
                    <app-nivel-badge slot="end" [nivel]="ruta.nivel_seguridad" />
                  </ion-item>
                } @empty {
                  <ion-note>No hay rutas registradas.</ion-note>
                }
              </ion-list>
            }
          </ion-card-content>
        </ion-card>

        <ion-grid class="ion-no-padding">
          <ion-row>
            @for (resumen of modulos(); track resumen.modulo.clave) {
              <ion-col size="12" sizeMd="6" sizeXl="4">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>
                      <ion-icon [name]="resumen.modulo.icono" color="primary"></ion-icon> {{ resumen.modulo.titulo }}
                    </ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-list lines="none">
                      @for (fila of resumen.entidades; track fila.entidad.endpoint) {
                        <ion-item [routerLink]="['/', fila.entidad.endpoint]" detail>
                          <ion-label>{{ fila.entidad.plural }}</ion-label>
                          <ion-note slot="end">{{ fila.total ?? '—' }}</ion-note>
                        </ion-item>
                      }
                    </ion-list>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            }
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  `,
})
export class InicioPage {
  private readonly api = inject(ApiService);
  private readonly datos = inject(DatosService);

  protected readonly rutas = signal<Ruta[] | null>(null);
  protected readonly error = signal('');
  protected readonly modulos = signal<ResumenModulo[]>(
    MODULOS.map((modulo) => ({
      modulo,
      entidades: entidadesDelModulo(modulo.clave).map((entidad) => ({ entidad, total: null })),
    })),
  );

  constructor() {
    effect(() => {
      this.datos.version();
      untracked(() => this.cargar());
    });
  }

  private cargar(): void {
    this.error.set('');
    this.api.rutas.listarTodos().subscribe({
      next: (rutas) => this.rutas.set(rutas),
      error: (e) => {
        this.rutas.set([]);
        this.error.set(mensajeError(e));
      },
    });
    const conteos = Object.fromEntries(
      this.modulos().flatMap((m) => m.entidades).map(({ entidad }) => [
        entidad.endpoint,
        this.api.recurso(entidad.endpoint).contar().pipe(catchError(() => of(null))),
      ]),
    );
    forkJoin(conteos).subscribe((totales) =>
      this.modulos.update((modulos) =>
        modulos.map((m) => ({
          ...m,
          entidades: m.entidades.map((f) => ({ ...f, total: totales[f.entidad.endpoint] ?? null })),
        })),
      ),
    );
  }
}
