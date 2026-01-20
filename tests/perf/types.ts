export interface FailedRequest {
    url: string;
    method: string;
    status?: number;
    failure?: string;
    resourceType: string;
  }
  
  export interface PerfMetrics {
    url: string;
    timestamp: string;
    domContentLoaded: number;
    loadEvent: number;
    lcp?: number;
    apiCalls: {
      url: string;
      responseTime: number;
    }[];
    failedRequests: FailedRequest[];
  }
  