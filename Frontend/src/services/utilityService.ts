import { apiService } from './api';

export interface RewriteTextRequest {
  text: string;
  context?: 'note' | 'todo' | 'message' | 'general';
}

export interface RewriteTextResponse {
  original_text: string;
  rewritten_text: string;
  improvement_applied: boolean;
}

class UtilityService {
  async rewriteText(request: RewriteTextRequest): Promise<RewriteTextResponse> {
    return apiService.post<RewriteTextResponse>('/utility/rewrite-text', request);
  }
}

export default new UtilityService();

