import { NumberInput } from './NumberInput'
import type { Units } from '../../types'

interface Props {
  valueCm: number
  onChangeCm: (cm: number) => void
  units: Units
  minCm?: number
  maxCm?: number
}

// Height is stored in cm but typed in the user's unit. Imperial users get two
// fields (feet + inches); both recombine into a clamped cm value.
export function HeightInput({ valueCm, onChangeCm, units, minCm = 130, maxCm = 220 }: Props) {
  if (units === 'imperial') {
    const totalIn = Math.round(valueCm / 2.54)
    const ft = Math.floor(totalIn / 12)
    const inch = totalIn % 12
    const setFromImperial = (f: number, i: number) => {
      const cm = Math.max(minCm, Math.min(maxCm, (f * 12 + i) * 2.54))
      onChangeCm(Math.round(cm))
    }
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <NumberInput
            value={ft}
            min={3}
            max={8}
            step={1}
            suffix="ft"
            ariaLabel="Height in feet"
            onChange={f => setFromImperial(f, inch)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <NumberInput
            value={inch}
            min={0}
            max={11}
            step={1}
            suffix="in"
            ariaLabel="Height in inches"
            onChange={i => setFromImperial(ft, i)}
          />
        </div>
      </div>
    )
  }
  return (
    <NumberInput
      value={Math.round(valueCm)}
      min={minCm}
      max={maxCm}
      step={1}
      suffix="cm"
      showRange
      ariaLabel="Height in centimeters"
      onChange={onChangeCm}
    />
  )
}
