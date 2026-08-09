import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";
import {
  ContactSubmission,
  Project,
  PublicContent,
} from "../models/content.model";
import { SAMPLE_CONTENT } from "../data/sample-content";

@Injectable({ providedIn: "root" })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getContent(): Observable<PublicContent> {
    return of(SAMPLE_CONTENT);
  }

  getProjects(): Observable<Project[]> {
    return of(SAMPLE_CONTENT.projects);
  }

  submitContact(
    payload: Omit<ContactSubmission, "id" | "createdAt" | "status">,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/api/portfolio/contact`,
      payload,
    );
  }
}
