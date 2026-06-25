import { useMessage } from 'naive-ui'

export function useToast() {
  const message = useMessage()

  return {
    success: (text: string) => message.success(text),
    error: (text: string) => message.error(text),
    info: (text: string) => message.info(text),
    warning: (text: string) => message.warning(text),
  }
}
