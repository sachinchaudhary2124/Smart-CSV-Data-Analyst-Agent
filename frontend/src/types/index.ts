export interface UploadedFile {
  filename: string;
  size_bytes: number;
  content_type: string;
  status: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface KPIDetail {
  value: string;
  change: string;
  trend: 'up' | 'down';
  label: string;
}

export interface AnalyticsData {
  revenue: KPIDetail;
  sales: KPIDetail;
  growth: KPIDetail;
  orders: KPIDetail;
  average_sales: KPIDetail;
  top_product: KPIDetail;
}

export interface InsightItem {
  title: string;
  description: string;
}

export interface RecommendationItem {
  title: string;
  action: string;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  date: string;
  summary: string;
  insights: InsightItem[];
  recommendations: RecommendationItem[];
}
