import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonList,
  IonNote, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController,
} from '@ionic/angular';
import { Observable, forkJoin } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Campo, Entidad, Opcion } from '../../core/entidades';
import { interpretarError } from '../../core/errores';
import { DatosService } from './datos.service';
import { construirCuerpo, crearFormulario, mensajeValidacion } from './formulario';

type Registro = Record<string, unknown> & { id: number };

const TIPO_INPUT: Record<string, string> = {
  text: 'text', email: 'email', url: 'url', number: 'number', integer: 'number',
  date: 'date', time: 'time', datetime: 'datetime-local',
};

/**
 * Formulario genérico de creación y edición. Valida en el cliente, pero muestra SIEMPRE los
 * mensajes 400 del backend bajo cada campo y el error general en un aviso y un toast.
 */
@Component({
  selector: 'app-formulario-entidad',
  host: { style: 'display: contents' },
  imports: [
    ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput,
    IonItem, IonList, IonNote, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonTitle, IonToolbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/' + entidad().endpoint"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ esEdicion() ? 'Editar' : 'Agregar' }}: {{ entidad().titulo }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="contenedor">
        @if (errorGeneral()) {
          <div class="aviso-error" role="alert" data-prueba="error-general">{{ errorGeneral() }}</div>
        }

        @if (cargando()) {
          <div class="ion-text-center ion-padding"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (form(); as formulario) {
          <form [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
            <ion-list>
              @for (campo of camposEditables(); track campo.nombre) {
                <ion-item [class.ion-invalid]="!!mensaje(campo)">
                  @switch (campo.tipo) {
                    @case ('checkbox') {
                      <ion-checkbox [formControlName]="campo.nombre" justify="space-between">
                        {{ campo.etiqueta }}
                      </ion-checkbox>
                    }
                    @case ('select') {
                      <ion-select [formControlName]="campo.nombre" [label]="etiquetaCampo(campo)"
                        labelPlacement="stacked" interface="popover" placeholder="Selecciona">
                        @if (!campo.requerido) {
                          <ion-select-option value="">Por omisión</ion-select-option>
                        }
                        @for (opcion of campo.opciones ?? []; track opcion.valor) {
                          <ion-select-option [value]="opcion.valor">{{ opcion.etiqueta }}</ion-select-option>
                        }
                      </ion-select>
                    }
                    @case ('fk') {
                      <ion-select [formControlName]="campo.nombre" [label]="etiquetaCampo(campo)"
                        labelPlacement="stacked" interface="alert" placeholder="Selecciona">
                        @if (!campo.requerido) {
                          <ion-select-option value="">Ninguno</ion-select-option>
                        }
                        @for (opcion of opcionesFk()[campo.endpoint ?? ''] ?? []; track opcion.valor) {
                          <ion-select-option [value]="opcion.valor">{{ opcion.etiqueta }}</ion-select-option>
                        }
                      </ion-select>
                    }
                    @case ('textarea') {
                      <ion-textarea [formControlName]="campo.nombre" [label]="etiquetaCampo(campo)"
                        labelPlacement="stacked" [autoGrow]="true" [helperText]="campo.ayuda"></ion-textarea>
                    }
                    @case ('json') {
                      <ion-textarea [formControlName]="campo.nombre" [label]="etiquetaCampo(campo)"
                        labelPlacement="stacked" [autoGrow]="true" [helperText]="campo.ayuda"></ion-textarea>
                    }
                    @default {
                      <ion-input [formControlName]="campo.nombre" [label]="etiquetaCampo(campo)"
                        labelPlacement="stacked" [type]="$any(tipoInput(campo))" [helperText]="campo.ayuda"
                        [step]="campo.tipo === 'number' ? 'any' : undefined"></ion-input>
                    }
                  }
                </ion-item>
                @if (mensaje(campo); as texto) {
                  <span class="error-campo" [attr.data-campo]="campo.nombre">{{ texto }}</span>
                }
              }
            </ion-list>

            <ion-button expand="block" type="submit" class="ion-margin-top" [disabled]="guardando()">
              @if (guardando()) { <ion-spinner name="dots"></ion-spinner> } @else { Guardar }
            </ion-button>
            <ion-note class="ion-padding-start">Los campos con * son obligatorios.</ion-note>
          </form>
        }
        <ng-content />
      </div>
    </ion-content>
  `,
})
export class FormularioEntidadComponent implements OnInit {
  readonly entidad = input.required<Entidad>();
  /** Id del registro a editar; sin id, el formulario crea uno nuevo. */
  readonly id = input<string | undefined>();
  /** Si es false, se queda en la página tras guardar (ej.: para mostrar un resultado). */
  readonly navegarAlGuardar = input(true);
  readonly guardado = output<Registro>();

  private readonly api = inject(ApiService);
  private readonly datos = inject(DatosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = signal<FormGroup | null>(null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGeneral = signal('');
  /** Mensajes 400 del backend por campo. */
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly opcionesFk = signal<Record<string, Opcion[]>>({});
  /** Fuerza el recálculo de mensajes de cliente al tocar o enviar. */
  private readonly intento = signal(0);

  protected readonly esEdicion = computed(() => !!this.id());
  protected readonly camposEditables = computed(() =>
    this.entidad().campos.filter((c) => !c.soloLectura && !(this.esEdicion() && c.soloCrear)),
  );

  ngOnInit(): void {
    this.cargarOpcionesFk();
    const id = this.id();
    if (!id) {
      // Valores sugeridos desde la URL, p. ej. /tramos/nuevo?ruta=5.
      this.armar(Object.fromEntries(this.route.snapshot.queryParamMap.keys.map((k) => [k, this.route.snapshot.queryParamMap.get(k)])));
      return;
    }
    this.cargando.set(true);
    this.api.recurso<Registro>(this.entidad().endpoint).obtener(id).subscribe({
      next: (registro) => {
        this.armar(registro);
        this.cargando.set(false);
      },
      error: (e) => {
        this.errorGeneral.set(interpretarError(e).general);
        this.cargando.set(false);
      },
    });
  }

  protected etiquetaCampo(campo: Campo): string {
    return campo.requerido && !(this.esEdicion() && campo.soloCrear) ? `${campo.etiqueta} *` : campo.etiqueta;
  }

  protected tipoInput(campo: Campo): string {
    return TIPO_INPUT[campo.tipo] ?? 'text';
  }

  /** Mensaje bajo el campo: primero el del backend; si no hay, el de validación del cliente. */
  protected mensaje(campo: Campo): string {
    this.intento();
    const servidor = this.erroresServidor()[campo.nombre];
    if (servidor) {
      return servidor;
    }
    const control = this.form()?.get(campo.nombre);
    return control && control.invalid && control.touched ? mensajeValidacion(campo, control.errors) : '';
  }

  protected guardar(): void {
    const formulario = this.form();
    if (!formulario) {
      return;
    }
    if (formulario.invalid) {
      formulario.markAllAsTouched();
      this.intento.update((v) => v + 1);
      void this.avisar('Revisa los campos marcados.', 'danger');
      return;
    }
    const entidad = this.entidad();
    const cuerpo = construirCuerpo(this.camposEditables(), formulario.getRawValue());
    const servicio = this.api.recurso<Registro>(entidad.endpoint);
    const id = this.id();
    const peticion: Observable<Registro> = !id
      ? servicio.crear(cuerpo as Partial<Registro>)
      : entidad.editarConPatch
        ? servicio.parchear(id, cuerpo as Partial<Registro>)
        : servicio.actualizar(id, cuerpo as Partial<Registro>);

    this.guardando.set(true);
    this.errorGeneral.set('');
    this.erroresServidor.set({});
    peticion.subscribe({
      next: (registro) => {
        this.guardando.set(false);
        this.datos.notificarCambio(entidad.endpoint);
        void this.avisar(`${id ? 'Cambios guardados' : 'Registro creado'}: ${entidad.titulo}.`, 'success');
        this.guardado.emit(registro);
        if (this.navegarAlGuardar()) {
          void this.router.navigate(['/', entidad.endpoint, registro.id], { replaceUrl: true });
        }
      },
      error: (e) => {
        this.guardando.set(false);
        const error = interpretarError(e);
        const visibles = new Set(this.camposEditables().map((c) => c.nombre));
        // Errores de campos que no están en el formulario se suman al mensaje general.
        const ocultos = Object.entries(error.campos).filter(([campo]) => !visibles.has(campo));
        const general = [error.general, ...ocultos.map(([campo, texto]) => `${campo}: ${texto}`)].join(' ');
        this.erroresServidor.set(error.campos);
        this.errorGeneral.set(general);
        void this.avisar(general, 'danger');
      },
    });
  }

  private armar(registro: Record<string, unknown>): void {
    const formulario = crearFormulario(this.camposEditables(), registro);
    // Al editar un campo se borra el mensaje del backend de ese campo.
    for (const [nombre, control] of Object.entries(formulario.controls)) {
      control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (this.erroresServidor()[nombre]) {
          const { [nombre]: _, ...resto } = this.erroresServidor();
          this.erroresServidor.set(resto);
        }
        this.intento.update((v) => v + 1);
      });
    }
    this.form.set(formulario);
  }

  private cargarOpcionesFk(): void {
    const endpoints = [...new Set(this.camposEditables().filter((c) => c.tipo === 'fk').map((c) => c.endpoint!))];
    if (!endpoints.length) {
      return;
    }
    forkJoin(Object.fromEntries(endpoints.map((e) => [e, this.datos.opcionesDe(e)]))).subscribe({
      next: (opciones) => this.opcionesFk.set(opciones),
      error: (e) => this.errorGeneral.set(`No se pudieron cargar las opciones: ${interpretarError(e).general}`),
    });
  }

  private async avisar(mensaje: string, color: 'success' | 'danger'): Promise<void> {
    const aviso = await this.toast.create({ message: mensaje, color, duration: 3500, position: 'top' });
    await aviso.present();
  }
}
