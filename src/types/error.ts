// 自定义错误类
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 错误代码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR'
}

// 错误消息映射
export const ErrorMessages = {
  [ErrorCode.UNAUTHORIZED]: '请先登录后再进行操作',
  [ErrorCode.NOT_FOUND]: '未找到请求的资源',
  [ErrorCode.VALIDATION]: '输入数据验证失败',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误',
  [ErrorCode.NETWORK_ERROR]: '网络连接错误',
  [ErrorCode.API_ERROR]: 'API 调用失败'
} 