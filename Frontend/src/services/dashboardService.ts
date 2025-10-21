// Dashboard service

import { apiService } from "./api";
import type { DashboardResponse } from "@/types/dashboard";

class DashboardService {
  // Get comprehensive dashboard analytics
  async getDashboard(): Promise<DashboardResponse> {
    return apiService.get<DashboardResponse>("/dashboard/");
  }
}

export const dashboardService = new DashboardService();

