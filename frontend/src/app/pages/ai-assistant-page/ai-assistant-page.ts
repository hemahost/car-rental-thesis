import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ChatbotRecommendation, ChatbotService, ChatHistoryItem } from '../../services/chatbot.service';

export interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  cars?: ChatbotRecommendation[];
  isLoading?: boolean;
}

@Component({
  selector: 'app-ai-assistant-page',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './ai-assistant-page.html',
  styleUrl: './ai-assistant-page.scss',
})
export class AIAssistantPage implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') chatBodyRef!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  message = '';
  loading = false;
  private shouldScroll = false;

  readonly chips = [
    'Find me a 7-seat car',
    'SUV under $80/day',
    '⚡ Electric cars',
    'Cheapest available car',
  ];

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.messages.push({
      role: 'bot',
      text: 'Hi! I am your AI car rental assistant. Ask me about our cars, prices, availability, or the rental process.',
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendChip(text: string): void {
    this.message = text;
    this.submit();
  }

  submit(): void {
    const trimmed = this.message.trim();
    if (!trimmed || this.loading) return;

    this.messages.push({ role: 'user', text: trimmed });
    this.message = '';
    this.loading = true;
    this.shouldScroll = true;

    const loadingIdx = this.messages.length;
    this.messages.push({ role: 'bot', text: '', isLoading: true });

    // Build history from the last 8 non-loading messages (4 exchanges) for context
    const history: ChatHistoryItem[] = this.messages
      .filter(m => !m.isLoading && m.text)
      .slice(-9, -1) // exclude the user message just pushed and the loading bubble
      .map(m => ({ role: m.role, text: m.text }));

    this.chatbotService.sendMessage(trimmed, history).subscribe({
      next: (res) => {
        this.messages[loadingIdx] = {
          role: 'bot',
          text: res.data.aiResponse,
          cars: res.data.recommendations.length > 0 ? res.data.recommendations : undefined,
        };
        this.loading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messages[loadingIdx] = {
          role: 'bot',
          text: err?.error?.error?.message || 'Sorry, something went wrong. Please try again.',
        };
        this.loading = false;
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
    });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  clearChat(): void {
    this.messages = [{
      role: 'bot',
      text: 'Hi! I am your AI car rental assistant. Ask me about our cars, prices, availability, or the rental process.',
    }];
    this.message = '';
    this.loading = false;
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatBodyRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}


