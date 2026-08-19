export const jsonResponse = (data: any, status: number = 200, headers?: HeadersInit) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
};

export const successResponse = (data: any, message: string = 'موفق', status: number = 200) => {
  return jsonResponse({ success: true, message, data }, status);
};

export const errorResponse = (message: string, status: number = 400, details?: any) => {
  return jsonResponse({ success: false, error: message, details }, status);
};

export const notFoundResponse = (message: string = 'یافت نشد') => {
  return errorResponse(message, 404);
};

export const unauthorizedResponse = (message: string = 'احراز هویت نشده') => {
  return errorResponse(message, 401);
};
