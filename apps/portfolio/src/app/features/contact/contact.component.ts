import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject,
  Input,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ContentService } from "../../services/content.service";
import { ScrollRevealDirective } from "../../shared/directives/scroll-reveal.directive";
import { ContactDetail } from "../../models/content.model";

declare global {
  interface Window {
    turnstile?: { render: (element: HTMLElement, options: any) => number };
  }
}

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [ReactiveFormsModule, ScrollRevealDirective],
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.scss"],
})
export class ContactComponent implements AfterViewInit {
  @Input() contactDetails: ContactDetail[] = [];
  @ViewChild("turnstileContainer", { static: true })
  private turnstileContainer!: ElementRef<HTMLDivElement>;

  readonly turnstileSiteKey = "0x4AAAAAAELTXo-MS2GJdd3B";
  private widgetRendered = false;

  readonly iconMap: Record<string, string> = {
    envelope: "✉️",
    "map-marker": "📍",
    phone: "📞",
  };

  private readonly fb = inject(FormBuilder);
  private readonly contentService = inject(ContentService);

  readonly submitting = signal(false);
  readonly submitStatus = signal<"idle" | "success" | "error">("idle");

  readonly form = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    subject: ["", Validators.required],
    message: ["", [Validators.required, Validators.minLength(10)]],
    honeypot_field: [""],
    captcha_token: ["", Validators.required],
  });

  ngAfterViewInit(): void {
    this.loadTurnstileScript();
  }

  private loadTurnstileScript(): void {
    const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptSrc}"]`,
    );

    if (existingScript) {
      if (window.turnstile) {
        this.renderTurnstile();
      } else {
        existingScript.addEventListener("load", () => this.renderTurnstile(), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => this.renderTurnstile();
    document.body.appendChild(script);
  }

  private renderTurnstile(): void {
    if (this.widgetRendered || !window.turnstile) {
      return;
    }

    this.widgetRendered = true;
    window.turnstile.render(this.turnstileContainer.nativeElement, {
      sitekey: this.turnstileSiteKey,
      callback: (token: string) => this.setCaptchaToken(token),
      "expired-callback": () => this.setCaptchaToken(""),
    });
  }

  private setCaptchaToken(token: string): void {
    this.form.get("captcha_token")?.setValue(token);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.submitStatus.set("idle");

    this.contentService.submitContact(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitStatus.set("success");
        this.form.reset();
        this.submitting.set(false);
      },
      error: () => {
        this.submitStatus.set("error");
        this.submitting.set(false);
      },
    });
  }
}
