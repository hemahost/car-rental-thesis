import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import {
  ChatbotFilters,
  ChatbotRecommendation,
  ChatbotService,
} from '../../services/chatbot.service';

@Component({
  selector: 'app-ai-assistant-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './ai-assistant-page.html',
  styleUrl: './ai-assistant-page.scss',
})
export class AIAssistantPage {
  message = '';
  loading = false;
  error = '';

  filters: ChatbotFilters | null = null;
  recommendations: ChatbotRecommendation[] = [];
  aiResponse = '';

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    const trimmed = this.message.trim();
    if (!trimmed) {
      this.error = 'Please enter what kind of car you are looking for.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.chatbotService.sendMessage(trimmed).subscribe({
      next: (res) => {
        this.filters = res.data.filters;
        this.recommendations = res.data.recommendations;
        this.aiResponse = res.data.aiResponse;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('AI assistant request failed:', err);
        this.error =
          err?.error?.error?.message ||
          'AI assistant is not available right now. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  clear(): void {
    this.message = '';
    this.filters = null;
    this.recommendations = [];
    this.aiResponse = '';
    this.error = '';
  }
}
