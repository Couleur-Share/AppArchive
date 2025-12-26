import { user } from '../lib/clerk'
import { AppError, ErrorCode } from '../types/error'

export const getAuthHeaders = () => {
  const userId = user.value?.id
  if (!userId) {
    throw new AppError('请先登录后再进行操作', ErrorCode.UNAUTHORIZED)
  }
  return { 'X-User-Id': userId }
}

