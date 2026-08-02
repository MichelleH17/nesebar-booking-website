type WeatherResponse = {
  current: { temp: number } | null
  daily: Array<{ date: string; min: number; max: number }>
  sea: number | null
}

export default defineCachedEventHandler(async (): Promise<WeatherResponse> => {
  try {
    const [forecast, marine] = await Promise.all([
      $fetch<any>('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: 42.66,
          longitude: 27.72,
          current: 'temperature_2m',
          daily: 'temperature_2m_max,temperature_2m_min',
          timezone: 'Europe/Sofia',
        },
      }),
      $fetch<any>('https://marine-api.open-meteo.com/v1/marine', {
        params: {
          latitude: 42.66,
          longitude: 27.72,
          daily: 'sea_surface_temperature_max',
          timezone: 'Europe/Sofia',
        },
      }).catch(() => null),
    ])

    const current = typeof forecast?.current?.temperature_2m === 'number'
      ? { temp: forecast.current.temperature_2m }
      : null

    const daily: Array<{ date: string; min: number; max: number }> = []
    const dates: string[] = forecast?.daily?.time ?? []
    const maxes: number[] = forecast?.daily?.temperature_2m_max ?? []
    const mins: number[] = forecast?.daily?.temperature_2m_min ?? []
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      if (date === undefined) continue
      daily.push({ date, min: mins[i] ?? 0, max: maxes[i] ?? 0 })
    }

    let sea: number | null = null
    const seaValues: number[] = marine?.daily?.sea_surface_temperature_max ?? []
    if (seaValues.length > 0 && typeof seaValues[0] === 'number') {
      sea = seaValues[0]
    }

    return { current, daily, sea }
  } catch {
    return { current: null, daily: [], sea: null }
  }
}, { maxAge: 1800 })
