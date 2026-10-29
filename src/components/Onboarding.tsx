import type { UserProfile } from '../types'
import { SafetyProfileForm } from './SafetyProfileForm'
export function Onboarding({onSave}: {onSave: (p: UserProfile) => Promise<void> | void}) { return <SafetyProfileForm onSave={onSave}/> }
