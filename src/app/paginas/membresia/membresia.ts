import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Registro en la membresía gratuita (RGPD):
 * - doble opt-in: se confirma desde el email;
 * - casillas separadas y sin marcar: newsletter por un lado, privacidad por otro;
 * - cumpleaños: solo día y mes.
 */
@Component({
  selector: 'td-membresia',
  imports: [FormsModule, RouterLink],
  templateUrl: './membresia.html',
  styles: `
    .pagina { padding: 2.5rem 0; max-width: 640px; }
    .intro { margin-bottom: 1.5rem; }
    .cumple { border: 1px solid var(--rubor); border-radius: 10px; display: flex; gap: 1rem; margin: 0 0 1rem; padding: .5rem 1rem 0; }
    .cumple legend { font-weight: 700; color: var(--salvia-oscuro); padding: 0 .3rem; }
    .cumple .campo { flex: 1; }
    .centro { text-align: center; }
    .nota { color: var(--rosa-profundo); font-size: .9rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Membresia {
  private readonly api = inject(ApiService);
  protected readonly dias = Array.from({ length: 31 }, (_, i) => i + 1);
  protected readonly meses = MESES;
  protected readonly datos = {
    nombre: '',
    email: '',
    cumpleDia: null as number | null,
    cumpleMes: null as number | null,
    aceptaNewsletter: false,
    aceptaPrivacidad: false,
  };
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fechaValida(): boolean {
    const { cumpleDia: d, cumpleMes: m } = this.datos;
    if (d === null && m === null) return true;
    if (d === null || m === null) return false;
    return d <= new Date(2024, m, 0).getDate(); // 2024 es bisiesto: admite el 29 de febrero
  }

  protected enviar(): void {
    this.enviando.set(true);
    this.error.set(null);
    const datos = { ...this.datos, nombre: this.datos.nombre.trim(), email: this.datos.email.trim() };
    this.api.registrarMiembro(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(
          e.status && e.status < 500
            ? (e.error?.detail ?? 'Revisa los datos.')
            : 'No hemos podido conectar. Inténtalo más tarde.',
        );
      },
    });
  }
}
