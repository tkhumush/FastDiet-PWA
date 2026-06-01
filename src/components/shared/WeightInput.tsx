import { NumberInput } from './NumberInput'
import type { Units } from '../../types'

const LB_PER_KG = 2.20462

interface Props {
  valueKg: number
  onChangeKg: (kg: number) => void
  units: Units
  minKg: number
  maxKg: number
  showRange?: boolean
}

// Weight is stored in kg but typed in the user's unit. For imperial users the
// field reads and writes pounds, converting back to kg on change.
export function WeightInput({ valueKg, onChangeKg, units, minKg, maxKg, showRange }: Props) {
  if (units === 'imperial') {
    return (
      <NumberInput
        value={+(valueKg * LB_PER_KG).toFixed(1)}
        min={+(minKg * LB_PER_KG).toFixed(1)}
        max={+(maxKg * LB_PER_KG).toFixed(1)}
        step={0.1}
        suffix="lb"
        showRange={showRange}
        ariaLabel="Weight in pounds"
        onChange={lb => onChangeKg(lb / LB_PER_KG)}
      />
    )
  }
  return (
    <NumberInput
      value={+valueKg.toFixed(1)}
      min={minKg}
      max={maxKg}
      step={0.1}
      suffix="kg"
      showRange={showRange}
      ariaLabel="Weight in kilograms"
      onChange={onChangeKg}
    />
  )
}
