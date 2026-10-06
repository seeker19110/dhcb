import { useSyncExternalStore } from 'react'
import { getAppSettings, subscribeAppSettings } from './appSettings'

export function useAppSettings() {
  return useSyncExternalStore(subscribeAppSettings, getAppSettings, getAppSettings)
}
