import { api } from "../apiClient";

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  semester?: string;
  color: string;
  icon: string;
  progress: number;
  created_at: string;
  last_opened_at: string;
}

export const subjectService = {
  async createSubject(
    userId: string,
    name: string,
    semester?: string,
    color = "#6366f1",
    icon = "📘"
  ): Promise<Subject> {
    const data = await api.post<any>("/subjects", {
      name,
      description: semester,
    });
    return {
      id: data.id,
      user_id: userId,
      name: data.name,
      semester: data.description,
      color: color,
      icon: icon,
      progress: 0,
      created_at: data.createdAt,
      last_opened_at: new Date().toISOString(),
    };
  },

  async getSubjects(userId: string): Promise<Subject[]> {
    const data = await api.get<any>("/subjects");
    // Spring Boot returns a PagedResponse if it's paginated. 
    // Usually { content: [...] }
    const items = data.content || data || [];
    return items.map((s: any) => ({
      id: s.id,
      user_id: userId,
      name: s.name,
      semester: s.description,
      color: "#6366f1",
      icon: "📘",
      progress: 0,
      created_at: s.createdAt,
      last_opened_at: s.createdAt,
    }));
  },

  async getSubject(userId: string, subjectId: string): Promise<Subject | null> {
    try {
      const s = await api.get<any>(`/subjects/${subjectId}`);
      return {
        id: s.id,
        user_id: userId,
        name: s.name,
        semester: s.description,
        color: "#6366f1",
        icon: "📘",
        progress: 0,
        created_at: s.createdAt,
        last_opened_at: s.createdAt,
      };
    } catch {
      return null;
    }
  },

  async updateSubject(subjectId: string, updates: Partial<Omit<Subject, "id" | "user_id" | "created_at">>) {
    const s = await api.put<any>(`/subjects/${subjectId}`, {
      name: updates.name,
      description: updates.semester,
    });
    return {
      id: s.id,
      name: s.name,
      semester: s.description,
      color: updates.color || "#6366f1",
      icon: updates.icon || "📘",
      progress: updates.progress || 0,
    } as Subject;
  },

  async updateLastOpened(subjectId: string) {
    // Backend doesn't have last_opened_at natively yet, mock it
  },

  async updateProgress(subjectId: string, progress: number) {
    // Handled in backend or mock
  },

  async recalculateProgress(subjectId: string, userId: string) {
    return 0;
  },

  async deleteSubject(subjectId: string) {
    await api.delete(`/subjects/${subjectId}`);
  },

  async getOrCreateDefault(userId: string): Promise<Subject> {
    const subjects = await this.getSubjects(userId);
    if (subjects.length > 0) return subjects[0];
    return this.createSubject(userId, "General", undefined, "#6366f1", "📚");
  },

  async getStudyPlans(userId: string, subjectId: string) {
    try {
      return await api.get<any[]>(`/ai/plans?subjectId=${subjectId}`);
    } catch {
      return [];
    }
  },

  async getChatSessions(userId: string, subjectId: string) {
    try {
      return await api.get<any[]>(`/ai/chat/sessions?subjectId=${subjectId}`);
    } catch {
      return [];
    }
  },
};
