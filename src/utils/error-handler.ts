import { AppError, ErrorCode, ErrorMessages } from '../types/error'

export const errorHandler = {
  handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCode.SERVER_ERROR
      )
    }

    return new AppError(
      '发生未知错误',
      ErrorCode.SERVER_ERROR
    )
  },

  // 处理 PostgreSQL 错误
  handlePostgresError(error: any): AppError {
    // PostgreSQL 错误代码参考: https://www.postgresql.org/docs/current/errcodes-appendix.html
    switch (error?.code) {
      case '23505': // unique_violation
        return new AppError(
          '数据已存在，不能重复添加',
          ErrorCode.VALIDATION
        )
      case '23503': // foreign_key_violation
        return new AppError(
          '数据关联错误，请检查相关数据是否存在',
          ErrorCode.VALIDATION
        )
      case '23502': // not_null_violation
        return new AppError(
          '缺少必填字段',
          ErrorCode.VALIDATION
        )
      case '42P01': // undefined_table
        return new AppError(
          '数据表不存在',
          ErrorCode.SERVER_ERROR
        )
      case '28P01': // invalid_password
        return new AppError(
          '数据库连接认证失败',
          ErrorCode.UNAUTHORIZED
        )
      case '08006': // connection_failure
        return new AppError(
          '数据库连接失败',
          ErrorCode.SERVER_ERROR
        )
      default:
        return new AppError(
          error?.message || '数据库操作失败',
          ErrorCode.SERVER_ERROR
        )
    }
  },

  // 保持 Supabase 错误处理以支持旧代码
  handleSupabaseError(error: any): AppError {
    if (error?.code === 'PGRST301') {
      return new AppError(
        ErrorMessages[ErrorCode.UNAUTHORIZED],
        ErrorCode.UNAUTHORIZED
      )
    }

    return new AppError(
      error?.message || '数据库操作失败',
      ErrorCode.SERVER_ERROR
    )
  },

  // 处理 API 错误
  handleApiError(error: any): AppError {
    if (error?.response?.status === 401) {
      return new AppError(
        ErrorMessages[ErrorCode.UNAUTHORIZED],
        ErrorCode.UNAUTHORIZED,
        401
      )
    }

    return new AppError(
      error?.message || 'API 请求失败',
      ErrorCode.API_ERROR
    )
  }
} 