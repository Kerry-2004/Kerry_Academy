const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Role = "admin" | "instructor" | "student";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  profile: {
    avatar: string | null;
    bio: string;
    phone: string;
    country: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: Category | null;
  instructor_name: string | null;
  price: string;
  thumbnail: string | null;
}

export type EnrollmentStatus = "pending_payment" | "active" | "completed";

export interface Enrollment {
  id: number;
  course: Course;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface HomeContent {
  hero_video: string | null;
  hero_poster: string | null;
}

export interface Testimonial {
  id: number;
  author_name: string;
  rating: number;
  comment: string;
  course_title: string;
  created_at: string;
}

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface MyTestimonial {
  id: number;
  course: number;
  course_title: string;
  rating: number;
  comment: string;
  status: TestimonialStatus;
  created_at: string;
}

export interface Ebook {
  id: number;
  title: string;
  slug: string;
  author: string;
  description: string;
  cover: string | null;
  price: string;
}

export type EbookOrderStatus = "pending" | "paid" | "cancelled";

export interface EbookOrderInfo {
  reference: string;
  status: EbookOrderStatus;
  ebook_title: string;
  price: string;
  whatsapp_number: string;
  contact_email: string;
}

export interface MyEbookOrder {
  id: number;
  reference: string;
  status: EbookOrderStatus;
  created_at: string;
  ebook_id: number;
  ebook_title: string;
  ebook_author: string;
  ebook_cover: string | null;
}

export interface QuizAnswer {
  id: number;
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  answers: QuizAnswer[];
}

export interface QuizResult {
  score: number;
  max_score: number;
}

export interface LessonProgress {
  id: number;
  title: string;
  order: number;
  content_type: "text" | "video" | "quiz" | "file";
  is_completed: boolean;
  is_locked: boolean;
  video: string | null;
  text_content: string | null;
  file: string | null;
  questions: QuizQuestion[];
  quiz_result: QuizResult | null;
}

export interface QuizQuestionResult {
  question_id: number;
  selected_answer_id: number | null;
  correct_answer_id: number | null;
  is_correct: boolean;
}

export interface QuizSubmission {
  lesson_id: number;
  score: number;
  max_score: number;
  results: QuizQuestionResult[];
}

export interface ModuleProgress {
  id: number;
  title: string;
  order: number;
  lessons: LessonProgress[];
  completed_count: number;
  total_count: number;
}

export interface CourseProgress {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string;
    thumbnail: string | null;
  };
  status: EnrollmentStatus;
  progress_percent: number;
  modules: ModuleProgress[];
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail ?? "Une erreur est survenue.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function register(data: { email: string; password: string; first_name?: string; last_name?: string }) {
  return request<{ access: string; user: User }>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return request<{ access: string; user: User }>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function refreshAccessToken() {
  return request<{ access: string }>("/api/auth/refresh/", { method: "POST" });
}

export function logout(accessToken: string) {
  return request<void>("/api/auth/logout/", { method: "POST" }, accessToken);
}

export function fetchMe(accessToken: string) {
  return request<User>("/api/auth/me/", {}, accessToken);
}

export function fetchCourses(categorySlug?: string) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  return request<Course[]>(`/api/courses/${query}`);
}

export function fetchCategories() {
  return request<Category[]>("/api/courses/categories/");
}

export function fetchCourse(slug: string) {
  return request<Course>(`/api/courses/${slug}/`);
}

export function fetchMyEnrollments(accessToken: string) {
  return request<Enrollment[]>("/api/enrollments/me/", {}, accessToken);
}

export function fetchHomeContent() {
  return request<HomeContent>("/api/content/home/");
}

export function fetchApprovedTestimonials() {
  return request<Testimonial[]>("/api/content/testimonials/");
}

export function fetchMyTestimonials(accessToken: string) {
  return request<MyTestimonial[]>("/api/content/testimonials/mine/", {}, accessToken);
}

export function submitTestimonial(
  data: { course: number; rating: number; comment: string },
  accessToken: string,
) {
  return request<MyTestimonial>(
    "/api/content/testimonials/submit/",
    { method: "POST", body: JSON.stringify(data) },
    accessToken,
  );
}

export function fetchEbooks() {
  return request<Ebook[]>("/api/content/ebooks/");
}

export function orderEbook(ebookId: number, accessToken: string) {
  return request<EbookOrderInfo>(
    `/api/content/ebooks/${ebookId}/order/`,
    { method: "POST" },
    accessToken,
  );
}

export function fetchMyEbookOrders(accessToken: string) {
  return request<MyEbookOrder[]>("/api/content/ebooks/orders/mine/", {}, accessToken);
}

// Téléchargement protégé : on récupère le fichier avec le token puis on
// déclenche l'enregistrement côté navigateur (un simple <a href> ne peut pas
// envoyer l'en-tête d'authentification).
export async function downloadEbook(ebookId: number, fallbackName: string, accessToken: string) {
  const response = await fetch(`${API_URL}/api/content/ebooks/${ebookId}/download/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.detail ?? "Téléchargement impossible.");
  }
  const blob = await response.blob();
  let filename = fallbackName;
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition && disposition.match(/filename\*?=(?:UTF-8'')?"?([^"';]+)"?/i);
  if (match) filename = decodeURIComponent(match[1]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function fetchCourseProgress(slug: string, accessToken: string) {
  return request<CourseProgress>(`/api/enrollments/${slug}/progress/`, {}, accessToken);
}

export function completeLesson(slug: string, lessonId: number, accessToken: string) {
  return request<{ lesson_id: number; completed: boolean }>(
    `/api/enrollments/${slug}/lessons/${lessonId}/complete/`,
    { method: "POST" },
    accessToken,
  );
}

export function submitQuiz(
  slug: string,
  lessonId: number,
  answers: Record<number, number>,
  accessToken: string,
) {
  return request<QuizSubmission>(
    `/api/enrollments/${slug}/lessons/${lessonId}/quiz/submit/`,
    { method: "POST", body: JSON.stringify({ answers }) },
    accessToken,
  );
}
