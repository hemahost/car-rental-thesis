import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FavoriteService } from './services/favorite.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  // Inject to ensure the service is created and subscribes to auth changes
  constructor(private _favoriteService: FavoriteService) {}
}
