export function useDemoNotice() {
  const message = useState<string>('demo-notice', () => '')
  let timer: ReturnType<typeof setTimeout> | undefined

  function show(msg: string) {
    message.value = msg
    if (import.meta.client) {
      clearTimeout(timer)
      timer = setTimeout(() => { message.value = '' }, 4000)
    }
  }

  return { message, show }
}
