import type { UserProfile, WeightSample } from '../types'
import { SafetyProfileForm } from './SafetyProfileForm'
export function ProfileEdit(props: {profile: UserProfile; weights: WeightSample[]; latestWeightKg?: number; onSave: (p: UserProfile) => Promise<void> | void; onRevoke: () => Promise<void>; onBack: () => void}) { return <SafetyProfileForm {...props}/> }
