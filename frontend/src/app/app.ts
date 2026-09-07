import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/history', label: 'History', icon: 'history' },
];

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly title = 'IoT Energy Monitor';
  protected readonly navLinks = NAV_LINKS;

  /**
   * Tracks whether the viewport is handset-sized. Drives both the sidenav's
   * mode (overlay vs. permanent) and its default open state, so the shell
   * behaves like a mobile drawer on small screens and a fixed sidebar on
   * larger ones — the "mobile-friendly" part of the app.
   */
  private readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: this.breakpointObserver.isMatched(Breakpoints.Handset) },
  );

  protected readonly sidenavMode = computed<'over' | 'side'>(() => (this.isHandset() ? 'over' : 'side'));
  protected readonly sidenavOpened = computed(() => !this.isHandset());

  /** Closes the drawer after a nav click, but only when it's an overlay (mobile) — a permanent sidebar should stay open. */
  protected closeIfOverlay(sidenav: MatSidenav): void {
    if (this.sidenavMode() === 'over') {
      void sidenav.close();
    }
  }
}
