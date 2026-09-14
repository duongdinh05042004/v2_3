export type BitrixResponse<T> = {
  result: T;
  error?: string;
  error_description?: string;
  time?: Record<string, unknown>;
};

export type BitrixLeadCreateResult = number;
export type BitrixDealCreateResult = number;
